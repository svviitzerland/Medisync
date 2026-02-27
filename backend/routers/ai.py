from fastapi import APIRouter, Body
from agents.triage import analyze_patient

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
