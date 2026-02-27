import json

from strands import tool

from database import supabase


@tool
def get_patient_info(nik: str) -> str:
    """Fetches patient profile information by their NIK (National ID Number).

    Args:
        nik: The patient's NIK (National ID Number).

    Returns:
        JSON string with patient profile data (id, name, age, nik, gender).
    """
    try:
        res = (
            supabase.table("profiles")
            .select("id, name, age, nik, phone, email")
            .eq("nik", nik)
            .single()
            .execute()
        )
        return json.dumps(res.data, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": f"Patient not found with NIK {nik}: {str(e)}"})


@tool
def get_patient_ticket_history(patient_id: str) -> str:
    """Fetches the patient's past medical ticket history including previous diagnoses and treatments.

    Args:
        patient_id: UUID of the patient.

    Returns:
        JSON string with list of past tickets (complaint, diagnosis, status, date).
    """
    try:
        res = (
            supabase.table("tickets")
            .select(
                "id, fo_note, doctor_note, status, severity_level, ai_reasoning, created_at, doctor_id"
            )
            .eq("patient_id", patient_id)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )

        # Collect doctor IDs to look up names
        doctor_ids = list(set(
            t["doctor_id"] for t in (res.data or []) if t.get("doctor_id")
        ))
        doctor_map = {}
        if doctor_ids:
            doc_res = (
                supabase.table("profiles")
                .select("id, name, specialization")
                .in_("id", doctor_ids)
                .execute()
            )
            for doc in doc_res.data or []:
                doctor_map[doc["id"]] = {
                    "name": doc.get("name", "N/A"),
                    "specialization": doc.get("specialization", "N/A"),
                }

        history = []
        for ticket in res.data or []:
            doc_info = doctor_map.get(ticket.get("doctor_id"), {})
            history.append(
                {
                    "ticket_id": ticket["id"],
                    "complaint": ticket.get("fo_note", ""),
                    "doctor_diagnosis": ticket.get("doctor_note", ""),
                    "doctor_name": doc_info.get("name", "N/A"),
                    "specialization": doc_info.get("specialization", "N/A"),
                    "status": ticket["status"],
                    "severity": ticket.get("severity_level", ""),
                    "date": ticket.get("created_at", ""),
                }
            )

        if not history:
            return json.dumps({"message": "No medical history found (new patient)."})

        return json.dumps(history, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def get_current_ticket(patient_id: str) -> str:
    """Fetches the patient's current active ticket (the one the doctor is examining right now).
    This includes the FO note (complaint), severity, and AI triage reasoning.

    Args:
        patient_id: UUID of the patient.

    Returns:
        JSON string with the current ticket data.
    """
    try:
        res = (
            supabase.table("tickets")
            .select(
                "id, fo_note, doctor_note, status, severity_level, ai_reasoning, created_at"
            )
            .eq("patient_id", patient_id)
            .in_("status", ["in_progress"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if res.data:
            return json.dumps(res.data[0], ensure_ascii=False)
        return json.dumps({"message": "No active ticket found for this patient."})
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def get_medicine_catalog() -> str:
    """Fetches the list of all medicines available in the hospital pharmacy.
    Use this to recommend only medicines that are actually in stock.

    Returns:
        JSON string with list of medicines (id, name, price, stock).
    """
    try:
        res = (
            supabase.table("catalog_medicines")
            .select("id, name, price, stock")
            .gt("stock", 0)
            .order("name")
            .execute()
        )
        return json.dumps(res.data or [], ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def submit_doctor_suggestion(
    diagnosis: str,
    treatment_plan: str,
    medicines: str,
    requires_inpatient: bool,
    reasoning: str,
) -> str:
    """Submits the final doctor suggestion after analyzing all patient data.
    MUST be called as the final step.

    Args:
        diagnosis: The suggested diagnosis based on symptoms and history.
        treatment_plan: Recommended treatment plan for the doctor to consider.
        medicines: JSON string of recommended medicines. Each item should have: medicine_id (int), medicine_name (str), quantity (int), notes (str with dosage instructions).
        requires_inpatient: Whether inpatient care is recommended.
        reasoning: Detailed reasoning explaining the suggestion.

    Returns:
        Confirmation that the suggestion has been recorded.
    """
    suggestion = {
        "diagnosis": diagnosis,
        "treatment_plan": treatment_plan,
        "medicines": medicines,
        "requires_inpatient": requires_inpatient,
        "reasoning": reasoning,
    }
    return json.dumps(
        {
            "status": "suggestion_recorded",
            "suggestion": suggestion,
            "instruction": "DONE. Your suggestion has been recorded. Do NOT call any more tools. Respond with a brief summary to the doctor.",
        },
        ensure_ascii=False,
    )
