from fastapi import APIRouter, HTTPException, Body
from database import supabase

router = APIRouter()


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
                            "status": "assigned_doctor",
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
):
    """
    FO creates a new ticket for the patient with auto-assigned Doctor and Nurse (If Inpatient).
    """
    try:
        nurse_team_id = None

        if requires_inpatient:
            # round-robin ...
            nurses_res = supabase.table("nurses").select("team_id").execute()
            active_teams = (
                set([n["team_id"] for n in nurses_res.data])
                if nurses_res.data
                else {1, 2, 3}
            )

            tickets_res = (
                supabase.table("tickets")
                .select("nurse_team_id")
                .in_("status", ["inpatient", "operation"])
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
        status = "assigned_doctor" if doctor_id else "draft"
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
                            "status": "assigned_doctor",
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
async def assign_doctor(ticket_id: int, doctor_id: str = Body(..., examples=["d1e2f3a4-b5c6-7890-abcd-ef1234567890"])):
    """
    Place the patient in the doctor's queue (changes ticket status to in_progress)
    """
    try:
        data, count = (
            supabase.table("tickets")
            .update({"doctor_id": doctor_id, "status": "assigned_doctor"})
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
            "description": "Checkup completed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "ticket": {
                            "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
                            "doctor_note": "Patient diagnosed with Upper Respiratory Tract Infection (URTI). Prescribed amoxicillin 500mg 3x daily and paracetamol 500mg as needed for fever.",
                            "status": "waiting_pharmacy",
                        },
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
    ticket_id: int,
    doctor_note: str = Body(..., examples=["Patient diagnosed with Upper Respiratory Tract Infection (URTI). Prescribed amoxicillin 500mg 3x daily and paracetamol 500mg as needed for fever."]),
    require_pharmacy: bool = Body(False, examples=[True]),
    requires_inpatient: bool = Body(False, examples=[False]),
):
    """
    Doctor finishes examination.
    Status can change to 'waiting_pharmacy', 'inpatient', or 'completed'.
    """
    new_status = "completed"
    if require_pharmacy:
        new_status = "waiting_pharmacy"
    elif requires_inpatient:
        new_status = "inpatient"

    try:
        data, count = (
            supabase.table("tickets")
            .update({"doctor_note": doctor_note, "status": new_status})
            .eq("id", ticket_id)
            .execute()
        )
        return {"status": "success", "ticket": data[1][0] if data[1] else None}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
