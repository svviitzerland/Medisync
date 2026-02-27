from fastapi import APIRouter, Body
from agents.triage import analyze_patient
from agents.doctor_assistant import get_doctor_suggestion
from agents.patient_chatbot import chat_with_patient

router = APIRouter()


@router.post("/analyze-ticket")
async def analyze_ticket(fo_note: str = Body(...), patient_id: str = Body(None)):
    """
    AI Triage Analysis using Strands Agent.
    Analyzes patient complaints, checks doctor availability, medical history,
    and provides doctor recommendations + inpatient care needs.
    """
    result = analyze_patient(fo_note=fo_note, patient_id=patient_id)
    return result


@router.post("/doctor-assist")
async def doctor_assist(nik: str = Body(...), doctor_draft: str = Body(None)):
    """
    AI Doctor Assistant using Strands Agent.
    Helps doctors during examination by providing diagnostic suggestions,
    treatment plans, and medicine recommendations based on patient data.

    - If doctor_draft is provided: AI reviews, enhances, and corrects the draft.
    - If doctor_draft is empty: AI generates a full diagnostic suggestion.
    """
    result = get_doctor_suggestion(nik=nik, doctor_draft=doctor_draft)
    return result


@router.post("/patient-chat")
async def patient_chat(
    ticket_id: str = Body(...),
    message: str = Body(...),
):
    """
    Patient Chatbot.
    Patients can ask questions about their medical situation.
    The bot answers based on the doctor's notes and diagnosis.
    If no doctor notes exist, the bot will inform the patient to wait.
    """
    result = chat_with_patient(ticket_id=ticket_id, message=message)
    return result
