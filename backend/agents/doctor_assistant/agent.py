import json

from strands import Agent

from agents.core.llm import create_model

from .prompts import SYSTEM_PROMPT
from .tools import (
    get_patient_info,
    get_patient_ticket_history,
    get_current_ticket,
    get_medicine_catalog,
    submit_doctor_suggestion,
)


def create_doctor_assistant_agent():
    """Creates an instance of the Strands Agent for doctor assistance."""
    model = create_model()
    agent = Agent(
        model=model,
        system_prompt=SYSTEM_PROMPT,
        tools=[
            get_patient_info,
            get_patient_ticket_history,
            get_current_ticket,
            get_medicine_catalog,
            submit_doctor_suggestion,
        ],
    )
    return agent


def get_doctor_suggestion(nik: str, doctor_draft: str = None) -> dict:
    """
    Main function called by the router.
    Creates the agent, sends the prompt, and extracts the suggestion.

    Args:
        nik: Patient's NIK (National ID).
        doctor_draft: Optional draft notes from the doctor.
    """
    agent = create_doctor_assistant_agent()

    # Build prompt
    prompt = f"""Please assist with the examination of a patient.

**Patient NIK:** {nik}

Steps to follow:
1. Use `get_patient_info` to fetch the patient's profile by NIK.
2. Use `get_current_ticket` to see the current complaint and triage info.
3. Use `get_patient_ticket_history` to check past medical history.
4. Use `get_medicine_catalog` to see available medicines.
5. Call `submit_doctor_suggestion` with your complete suggestion.
"""

    if doctor_draft:
        prompt += f"""
**Doctor's Draft Notes:**
<draft>
{doctor_draft}
</draft>

The doctor has written initial notes above. Please review, enhance, and correct them based on the patient data. Keep the doctor's original intent but add anything they may have missed.
"""
    else:
        prompt += """
The doctor has not written any notes yet. Please provide a comprehensive diagnostic suggestion including diagnosis, treatment plan, and medicine recommendations based on all available patient data.
"""

    try:
        result = agent(prompt)

        # Extract the submit_doctor_suggestion tool call from messages
        messages = agent.messages
        suggestion = None

        for msg in reversed(messages):
            if isinstance(msg, dict) and msg.get("role") == "assistant":
                for block in msg.get("content", []):
                    if isinstance(block, dict):
                        if (
                            block.get("toolUse", {}).get("name")
                            == "submit_doctor_suggestion"
                        ):
                            suggestion = block["toolUse"].get("input", {})
                            break
            if suggestion:
                break

        if suggestion:
            # Parse medicines if it's a JSON string
            medicines = suggestion.get("medicines", "[]")
            if isinstance(medicines, str):
                try:
                    medicines = json.loads(medicines)
                except json.JSONDecodeError, TypeError:
                    medicines = []

            return {
                "status": "success",
                "suggestion": {
                    "diagnosis": suggestion.get("diagnosis", ""),
                    "treatment_plan": suggestion.get("treatment_plan", ""),
                    "medicines": medicines,
                    "requires_inpatient": suggestion.get("requires_inpatient", False),
                    "reasoning": suggestion.get("reasoning", str(result)),
                },
            }
        else:
            # Fallback: agent did not call submit tool
            return {
                "status": "success",
                "suggestion": {
                    "diagnosis": "",
                    "treatment_plan": "",
                    "medicines": [],
                    "requires_inpatient": False,
                    "reasoning": str(result),
                },
            }

    except Exception as e:
        return {
            "status": "error",
            "message": f"AI Assistant error: {str(e)}. Please proceed manually.",
        }
