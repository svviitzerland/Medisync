import json
from typing import Literal
from strands import tool
from database import supabase


@tool
def get_available_doctors() -> str:
    """Retrieves the list of available specialist doctors in the hospital along with their specializations.
    Use this tool to find out which doctors are currently available to accept patients.

    Returns:
        JSON string containing a list of doctors with their id, name, and specialization.
    """
    try:
        res = (
            supabase.table("profiles")
            .select("id, name, specialization")
            .eq("role", "doctor_specialist")
            .not_.is_("specialization", "null")
            .execute()
        )
        doctors = []
        for doc in res.data or []:
            doctors.append(
                {
                    "id": doc["id"],
                    "name": doc.get("name", "Unknown"),
                    "specialization": doc.get("specialization", "General"),
                }
            )
        return json.dumps(doctors, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def get_patient_history(patient_id: str) -> str:
    """Retrieves the medical history of a patient based on patient_id.
    Use this tool to see if the patient has been treated before,
    their previous complaints, any previous inpatient admissions, and past doctor diagnoses.

    Args:
        patient_id: UUID of the patient whose history needs to be checked.

    Returns:
        JSON string containing the patient's previous visit/ticket history.
    """
    try:
        res = (
            supabase.table("tickets")
            .select(
                "id, fo_note, doctor_note, status, created_at, doctor_id"
            )
            .eq("patient_id", patient_id)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )

        # Collect doctor IDs to fetch names
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
                    "was_inpatient": ticket["status"] in ("inpatient", "operation"),
                    "date": ticket.get("created_at", ""),
                }
            )

        if not history:
            return json.dumps(
                {"message": "This patient has no prior medical history (new patient)."}
            )

        return json.dumps(history, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def submit_triage_decision(
    recommended_doctor_id: str,
    recommended_doctor_name: str,
    predicted_specialization: str,
    requires_inpatient: bool,
    severity_level: Literal["low", "medium", "high"],
    reasoning: str,
) -> str:
    """Submits the final triage decision after analyzing the complaint, doctor availability, and patient history.
    MUST be called as the final step after analysis is complete.

    Args:
        recommended_doctor_id: UUID of the recommended doctor (from get_available_doctors).
        recommended_doctor_name: Name of the recommended doctor.
        predicted_specialization: Target specialization (e.g., Neurology, Pediatrics, General Surgery, etc.).
        requires_inpatient: True if the patient requires inpatient care, False for outpatient.
        severity_level: Severity level. MUST BE EXACTLY ONE OF: 'low', 'medium', or 'high'. Do not use 'medium-high' or other variations.
        reasoning: Comprehensive explanation of why this decision was made, including patient history and severity level considerations.

    Returns:
        Confirmation that the triage decision has been recorded.
    """
    decision = {
        "recommended_doctor_id": recommended_doctor_id,
        "recommended_doctor_name": recommended_doctor_name,
        "predicted_specialization": predicted_specialization,
        "requires_inpatient": requires_inpatient,
        "severity_level": severity_level,
        "reasoning": reasoning,
    }
    return json.dumps(
        {"status": "decision_recorded", "decision": decision}, ensure_ascii=False
    )


@tool
def reject_complaint(reasoning: str) -> str:
    """Rejects the patient complaint if it is gibberish, nonsensical, or clearly not a medical issue.
    MUST be called as the final step if the complaint cannot be triaged safely.

    Args:
        reasoning: Comprehensive explanation of why the complaint was rejected.

    Returns:
        Confirmation that the complaint has been rejected.
    """
    return json.dumps(
        {"status": "rejected", "reasoning": reasoning}, ensure_ascii=False
    )
