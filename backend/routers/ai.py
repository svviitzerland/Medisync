from fastapi import APIRouter, Body, HTTPException, Depends
from database import supabase
from agents.triage import analyze_patient, summarize_qa_history
from agents.triage.questions import generate_pre_assessment_questions
from agents.doctor_assistant import get_doctor_suggestion
from agents.patient_chatbot import chat_with_patient
from dependencies import get_current_user

router = APIRouter()


@router.post(
    "/generate-pre-assessment-questions",
    responses={
        200: {
            "description": "Pre-assessment questions generated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "questions": [
                            "How long have you been experiencing this headache?",
                            "On a scale of 1-10, how severe is the pain?",
                            "Are you experiencing any other symptoms like nausea, sensitivity to light, or fever?"
                        ],
                    }
                }
            },
        },
        401: {
            "description": "Unauthorized - Missing or invalid token",
        },
    },
)
async def generate_questions(
    complaint: str = Body(..., examples=["I have a severe headache that won't go away"]),
    user: dict = Depends(get_current_user),
):
    """
    Generate follow-up questions for the pre-assessment chat based on the patient's initial complaint.
    Returns a JSON array of 3-5 strings representing the questions.
    """
    result = generate_pre_assessment_questions(complaint)
    return result


@router.post(
    "/submit-pre-assessment",
    responses={
        200: {
            "description": "Pre-assessment submitted and ticket created",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "ticket_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
                        "assessment_id": "e5f6a7b8-9012-cdef-1234-567890123456",
                    }
                }
            },
        },
        400: {
            "description": "Submission failed",
            "content": {"application/json": {"example": {"detail": "Error creating ticket"}}},
        },
        401: {
            "description": "Unauthorized - Missing or invalid token",
        },
    },
)
async def submit_pre_assessment(
    qa_history: list = Body(..., examples=[[{"role": "user", "content": "I have a headache"}, {"role": "assistant", "content": "How long?"}]]),
    user: dict = Depends(get_current_user),
):
    """
    Submit a pre-consultation AI assessment.
    This creates a new ticket containing the AI's summary as the FO note,
    and saves the raw Q&A history to the ai_pre_assessments table for the doctor to review.
    """
    patient_id = user.get("sub") # use the authenticated user ID
    
    if not patient_id:
        raise HTTPException(status_code=401, detail="Invalid token payload: missing subject")
    try:
        # 1. Generate AI Summary from QA History
        summary_res = summarize_qa_history(qa_history)
        if summary_res.get("status") == "error":
            raise Exception("Failed to generate AI summary: " + summary_res.get("message", "Unknown error"))
        ai_summary = summary_res.get("summary", "Summary generation failed.")

        # 2. Analyze Patient to get doctor suggestion
        triage_res = analyze_patient(fo_note=ai_summary, patient_id=patient_id)
        suggested_doctor_id = None
        if triage_res.get("status") == "success" and "analysis" in triage_res:
            suggested_doctor_id = triage_res["analysis"].get("recommended_doctor_id")

        # 3. Create the Ticket
        status = "in_progress" if suggested_doctor_id else "pending"
        ticket_payload = {
            "patient_id": patient_id,
            "fo_note": ai_summary,  # The AI summary acts as the initial FO note
            "status": status,
            "doctor_id": suggested_doctor_id,
            "ai_reasoning": "Auto-generated from pre-consultation assessment",
        }
        
        ticket_res, _ = supabase.table("tickets").insert(ticket_payload).execute()
        if not ticket_res[1]:
            raise Exception("Failed to create ticket")
            
        ticket_id = ticket_res[1][0]["id"]

        # 4. Save the Assessment History
        assessment_payload = {
            "ticket_id": ticket_id,
            "patient_id": patient_id,
            "qa_history": qa_history,
            "ai_summary": ai_summary,
        }
        
        assessment_res, _ = supabase.table("ai_pre_assessments").insert(assessment_payload).execute()
        
        return {
            "status": "success",
            "ticket_id": ticket_id,
            "assessment_id": assessment_res[1][0]["id"] if assessment_res[1] else None,
            "ai_summary": ai_summary,
            "suggested_doctor_id": suggested_doctor_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



@router.post(
    "/analyze-ticket",
    responses={
        200: {
            "description": "AI triage analysis result",
            "content": {
                "application/json": {
                    "examples": {
                        "success": {
                            "summary": "Successful triage analysis",
                            "value": {
                                "status": "success",
                                "analysis": {
                                    "predicted_specialization": "Internal Medicine",
                                    "recommended_doctor_id": "d1e2f3a4-b5c6-7890-abcd-ef1234567890",
                                    "recommended_doctor_name": "Dr. Andi Wijaya, Sp.PD",
                                    "requires_inpatient": False,
                                    "severity_level": "moderate",
                                    "reasoning": "Patient shows symptoms of high fever and headache that may indicate viral infection. Referred to Internal Medicine specialist for further examination.",
                                },
                            },
                        },
                        "rejected": {
                            "summary": "Invalid complaint rejected",
                            "value": {
                                "status": "error",
                                "message": "The complaint does not contain valid medical information to process.",
                            },
                        },
                    }
                }
            },
        },
        401: {
            "description": "Unauthorized - Missing or invalid token",
        },
    },
)
async def analyze_ticket(
    fo_note: str = Body(..., examples=["Patient complains of severe headache for 3 days, accompanied by nausea and high fever"]),
    patient_id: str = Body(None, examples=["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]),
    user: dict = Depends(get_current_user),
):
    """
    AI Triage Analysis using Strands Agent.
    Analyzes patient complaints, checks doctor availability, medical history,
    and provides doctor recommendations + inpatient care needs.
    """
    result = analyze_patient(fo_note=fo_note, patient_id=patient_id)
    return result


@router.post(
    "/doctor-assist",
    responses={
        200: {
            "description": "AI doctor assistant suggestion",
            "content": {
                "application/json": {
                    "examples": {
                        "success": {
                            "summary": "Successful diagnostic suggestion",
                            "value": {
                                "status": "success",
                                "suggestion": {
                                    "diagnosis": "Dengue Hemorrhagic Fever (DHF) Grade II",
                                    "treatment_plan": "1. Hospitalize for observation and rehydration.\n2. Monitor platelet count and hematocrit every 6 hours.\n3. IV fluid Ringer Lactate 500ml/8hrs.\n4. Paracetamol 500mg if fever > 38.5°C.",
                                    "medicines": [
                                        {"name": "Paracetamol 500mg", "quantity": 10, "notes": "3x daily, if fever"},
                                        {"name": "Ringer Lactate IV 500ml", "quantity": 3, "notes": "IV drip, 500ml/8hrs"},
                                    ],
                                    "requires_inpatient": True,
                                    "reasoning": "Patient's platelet count is low (85,000) with signs of plasma leakage. Hospitalization required for close monitoring.",
                                },
                            },
                        },
                        "error": {
                            "summary": "AI assistant error",
                            "value": {
                                "status": "error",
                                "message": "AI Assistant error: Model timeout. Please proceed manually.",
                            },
                        },
                    }
                }
            },
        },
        401: {
            "description": "Unauthorized - Missing or invalid token",
        },
    },
)
async def doctor_assist(
    nik: str = Body(..., examples=["3201012345678901"]),
    doctor_draft: str = Body(None, examples=["Suspected DHF, requires complete blood count and 24-hour observation"]),
    user: dict = Depends(get_current_user),
):
    """
    AI Doctor Assistant using Strands Agent.
    Helps doctors during examination by providing diagnostic suggestions,
    treatment plans, and medicine recommendations based on patient data.

    - If doctor_draft is provided: AI reviews, enhances, and corrects the draft.
    - If doctor_draft is empty: AI generates a full diagnostic suggestion.
    """
    result = get_doctor_suggestion(nik=nik, doctor_draft=doctor_draft)
    return result


@router.post(
    "/patient-chat",
    responses={
        200: {
            "description": "Patient chatbot response",
            "content": {
                "application/json": {
                    "examples": {
                        "with_context": {
                            "summary": "Reply with doctor notes available",
                            "value": {
                                "status": "success",
                                "reply": "Based on the doctor's notes, amoxicillin 500mg should be taken after meals to reduce stomach side effects. Take it 3 times daily every 8 hours.",
                                "has_context": True,
                                "ticket_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
                            },
                        },
                        "no_notes": {
                            "summary": "No doctor notes yet",
                            "value": {
                                "status": "success",
                                "reply": "Your doctor hasn't provided any notes yet. Please wait for your examination to be completed, or contact the front office for more information.",
                                "has_context": False,
                            },
                        },
                        "error": {
                            "summary": "Chat error",
                            "value": {
                                "status": "error",
                                "message": "Chat error: Ticket not found.",
                            },
                        },
                    }
                }
            },
        },
        401: {
            "description": "Unauthorized - Missing or invalid token",
        },
    },
)
async def patient_chat(
    ticket_id: str = Body(..., examples=["b2c3d4e5-f6a7-8901-bcde-f12345678901"]),
    message: str = Body(..., examples=["Doctor, should I take the medicine before or after meals?"]),
    user: dict = Depends(get_current_user),
):
    """
    Patient Chatbot.
    Patients can ask questions about their medical situation.
    The bot answers based on the doctor's notes and diagnosis.
    If no doctor notes exist, the bot will inform the patient to wait.
    """
    result = chat_with_patient(ticket_id=ticket_id, message=message)
    return result
