import json
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
        res = supabase.table("doctors").select("id, specialization, profile:profiles(name)").execute()
        doctors = []
        for doc in (res.data or []):
            doctors.append({
                "id": doc["id"],
                "name": doc["profile"]["name"] if doc.get("profile") else "Unknown",
                "specialization": doc["specialization"]
            })
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
            .select("id, fo_note, doctor_note, status, created_at, doctor:doctors(specialization, profile:profiles(name))")
            .eq("patient_id", patient_id)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        history = []
        for ticket in (res.data or []):
            doc_name = "N/A"
            doc_spec = "N/A"
            if ticket.get("doctor"):
                doc_spec = ticket["doctor"].get("specialization", "N/A")
                if ticket["doctor"].get("profile"):
                    doc_name = ticket["doctor"]["profile"].get("name", "N/A")

            history.append({
                "ticket_id": ticket["id"],
                "complaint": ticket.get("fo_note", ""),
                "doctor_diagnosis": ticket.get("doctor_note", ""),
                "doctor_name": doc_name,
                "specialization": doc_spec,
                "status": ticket["status"],
                "was_inpatient": ticket["status"] in ("inpatient", "operation"),
                "date": ticket.get("created_at", "")
            })
        
        if not history:
            return json.dumps({"message": "This patient has no prior medical history (new patient)."})
        
        return json.dumps(history, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def submit_triage_decision(
    recommended_doctor_id: str,
    recommended_doctor_name: str,
    predicted_specialization: str,
    requires_inpatient: bool,
    severity_level: str,
    reasoning: str
) -> str:
    """Submits the final triage decision after analyzing the complaint, doctor availability, and patient history.
    MUST be called as the final step after analysis is complete.

    Args:
        recommended_doctor_id: UUID of the recommended doctor (from get_available_doctors).
        recommended_doctor_name: Name of the recommended doctor.
        predicted_specialization: Target specialization (e.g., Neurology, Pediatrics, General Surgery, etc.).
        requires_inpatient: True if the patient requires inpatient care, False for outpatient.
        severity_level: Severity level: 'low', 'medium', or 'high'.
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
        "reasoning": reasoning
    }
    return json.dumps({"status": "decision_recorded", "decision": decision}, ensure_ascii=False)
