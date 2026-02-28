from fastapi import APIRouter, HTTPException, Body
from database import supabase

router = APIRouter()


from dependencies import get_current_user
from fastapi import Depends

@router.post(
    "/create",
    responses={
        200: {
            "description": "Ticket created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "ticket": {
                            "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
                            "patient_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                            "fo_note": "Patient presents with high fever and productive cough for 5 days",
                            "doctor_id": "d1e2f3a4-b5c6-7890-abcd-ef1234567890",
                            "status": "in_progress",
                            "severity_level": "moderate",
                            "ai_reasoning": "Symptoms indicate respiratory tract infection",
                            "created_at": "2026-02-28T01:00:00+07:00",
                        },
                        "assigned_nurse_team": None,
                    }
                }
            },
        },
        400: {
            "description": "Ticket creation failed",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid patient_id: UUID not found"}
                }
            },
        },
    },
)
async def create_ticket(
    patient_id: str = Body(..., examples=["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]),
    fo_note: str = Body("", examples=["Patient presents with high fever and productive cough for 5 days"]),
    doctor_id: str = Body(None, examples=["d1e2f3a4-b5c6-7890-abcd-ef1234567890"]),
    requires_inpatient: bool = Body(False, examples=[False]),
    severity_level: str = Body(None, examples=["moderate"]),
    ai_reasoning: str = Body(None, examples=["Symptoms indicate respiratory tract infection, requires pulmonologist examination"]),
    user: dict = Depends(get_current_user),
):
    """
    FO creates a new ticket for the patient with auto-assigned Doctor and Nurse (If Inpatient).
    """
    try:
        nurse_team_id = None
        room_id = None

        if requires_inpatient:
            # 1. Assign Room
            rooms_res = supabase.table("rooms").select("id").eq("status", "available").limit(1).execute()
            if not rooms_res.data:
                raise HTTPException(status_code=400, detail="No available rooms for inpatient admission")
            
            room_id = rooms_res.data[0]["id"]
            # Mark room as occupied
            supabase.table("rooms").update({"status": "occupied"}).eq("id", room_id).execute()

            # 2. round-robin nurse team
            nurses_res = supabase.table("profiles").select("team_id").eq("role", "nurse").not_.is_("team_id", "null").execute()
            active_teams = (
                set([n["team_id"] for n in nurses_res.data])
                if nurses_res.data
                else {1, 2, 3}
            )

            tickets_res = (
                supabase.table("tickets")
                .select("nurse_team_id")
                .in_("status", ["in_progress"])
                .execute()
            )

            team_loads = {t: 0 for t in active_teams}
            if tickets_res.data:
                for tkt in tickets_res.data:
                    tid = tkt.get("nurse_team_id")
                    if tid in team_loads:
                        team_loads[tid] += 1

            nurse_team_id = min(team_loads, key=team_loads.get)

        # Create Ticket
        status = "in_progress" if doctor_id else "pending"
        payload = {
            "patient_id": patient_id,
            "fo_note": fo_note,
            "status": status,
            "doctor_id": doctor_id,
            "severity_level": severity_level,
            "ai_reasoning": ai_reasoning,
        }

        if nurse_team_id:
            payload["nurse_team_id"] = nurse_team_id
        if room_id:
            payload["room_id"] = room_id

        data, count = supabase.table("tickets").insert(payload).execute()
        return {
            "status": "success",
            "ticket": data[1][0] if data[1] else None,
            "assigned_nurse_team": nurse_team_id,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/{ticket_id}/assign-doctor",
    responses={
        200: {
            "description": "Doctor assigned successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "ticket": {
                            "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
                            "doctor_id": "d1e2f3a4-b5c6-7890-abcd-ef1234567890",
                            "status": "in_progress",
                        },
                    }
                }
            },
        },
        400: {
            "description": "Assignment failed",
            "content": {
                "application/json": {
                    "example": {"detail": "Ticket not found"}
                }
            },
        },
    },
)
async def assign_doctor(
    ticket_id: int, 
    doctor_id: str = Body(..., examples=["d1e2f3a4-b5c6-7890-abcd-ef1234567890"]),
    user: dict = Depends(get_current_user),
):
    """
    Place the patient in the doctor's queue (changes ticket status to in_progress)
    """
    try:
        data, count = (
            supabase.table("tickets")
            .update({"doctor_id": doctor_id, "status": "in_progress"})
            .eq("id", ticket_id)
            .execute()
        )
        return {"status": "success", "ticket": data[1][0] if data[1] else None}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/{ticket_id}/complete-checkup",
    responses={
        200: {
            "description": "Checkup completed, prescriptions saved, invoice generated",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "ticket": {
                            "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
                            "doctor_note": "Patient diagnosed with URTI.",
                            "status": "completed",
                        },
                        "prescriptions_count": 2,
                        "invoice_id": "f1e2d3c4-b5a6-7890-cdef-123456789012",
                    }
                }
            },
        },
        400: {
            "description": "Checkup completion failed",
            "content": {
                "application/json": {
                    "example": {"detail": "Ticket not found"}
                }
            },
        },
    },
)
async def complete_checkup(
    ticket_id: str,
    doctor_note: str = Body(..., examples=["Patient diagnosed with URTI."]),
    prescriptions: list = Body([], examples=[[{"medicine_id": 1, "quantity": 10, "notes": "3x daily after meals"}]]),
    doctor_fee: float = Body(150000, examples=[150000]),
    user: dict = Depends(get_current_user),
):
    """
    Doctor finishes examination.
    - Saves doctor_note on ticket
    - Creates prescription records if medicines are provided
    - Calculates medicine_fee from catalog_medicines prices
    - Auto-generates an invoice
    - Status is always set to completed
    """
    new_status = "completed"

    try:
        # 0. Check if there was a room assigned, to release it
        ticket_res = supabase.table("tickets").select("room_id").eq("id", ticket_id).execute()
        room_id_to_release = None
        if ticket_res.data and ticket_res.data[0].get("room_id"):
            room_id_to_release = ticket_res.data[0]["room_id"]

        # 1. Update ticket & release associations
        data, count = (
            supabase.table("tickets")
            .update({
                "doctor_note": doctor_note, 
                "status": new_status,
                "room_id": None,
                "nurse_team_id": None
            })
            .eq("id", ticket_id)
            .execute()
        )
        ticket = data[1][0] if data[1] else None

        # Release the room itself
        if room_id_to_release:
            supabase.table("rooms").update({"status": "available"}).eq("id", room_id_to_release).execute()


        # 2. Create prescriptions if any
        medicine_fee = 0.0
        prescriptions_created = 0

        if prescriptions:
            for rx in prescriptions:
                med_id = rx.get("medicine_id")
                qty = rx.get("quantity", 1)
                notes = rx.get("notes", "")

                # Get medicine price from catalog
                med_res = supabase.table("catalog_medicines").select("price").eq("id", med_id).execute()
                price = float(med_res.data[0]["price"]) if med_res.data else 0
                medicine_fee += price * qty

                supabase.table("prescriptions").insert({
                    "ticket_id": ticket_id,
                    "medicine_id": med_id,
                    "quantity": qty,
                    "notes": notes,
                    "status": "pending",
                }).execute()
                prescriptions_created += 1

        # 3. Auto-generate invoice
        invoice_payload = {
            "ticket_id": ticket_id,
            "doctor_fee": doctor_fee,
            "medicine_fee": medicine_fee,
            "room_fee": 0,  # room fee set separately if inpatient
            "status": "unpaid",
        }
        inv_res, _ = supabase.table("invoices").insert(invoice_payload).execute()
        invoice_id = inv_res[1][0]["id"] if inv_res[1] else None

        return {
            "status": "success",
            "ticket": ticket,
            "prescriptions_count": prescriptions_created,
            "invoice_id": invoice_id,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
