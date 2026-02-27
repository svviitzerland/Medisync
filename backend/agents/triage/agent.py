from strands import Agent

from agents.core.llm import create_model
from .tools import get_available_doctors, get_patient_history, submit_triage_decision
from .prompts import SYSTEM_PROMPT

def create_triage_agent():
    """Creates an instance of the Strands Agent for medical triage."""
    model = create_model()
    agent = Agent(
        model=model,
        system_prompt=SYSTEM_PROMPT,
        tools=[get_available_doctors, get_patient_history, submit_triage_decision],
    )
    return agent


def analyze_patient(fo_note: str, patient_id: str = None) -> dict:
    """
    Main function called by the router.
    Creates the agent, sends the prompt, and extracts the triage decision.
    """
    agent = create_triage_agent()

    # Build prompt
    prompt = f"""Please analyze the following patient complaint and make a triage decision:

**Patient Complaint:**
{fo_note}
"""
    if patient_id:
        prompt += f"\n**Patient ID:** {patient_id}\nPlease check the medical history of this patient using the get_patient_history tool.\n"
    else:
        prompt += "\n*New patient, no patient_id available to check history.*\n"

    prompt += "\nPerform the following steps: (1) check available doctors, (2) check patient history if available, (3) submit triage decision."

    try:
        result = agent(prompt)

        # Search for tool result from submit_triage_decision in messages
        messages = agent.messages
        decision = None
        for msg in reversed(messages):
            if isinstance(msg, dict) and msg.get("role") == "assistant":
                for block in msg.get("content", []):
                    if isinstance(block, dict) and block.get("toolUse", {}).get("name") == "submit_triage_decision":
                        decision_input = block["toolUse"].get("input", {})
                        decision = decision_input
                        break
            if decision:
                break

        if decision:
            return {
                "status": "success",
                "analysis": {
                    "predicted_specialization": decision.get("predicted_specialization", "Internal Medicine"),
                    "recommended_doctor_id": decision.get("recommended_doctor_id"),
                    "recommended_doctor_name": decision.get("recommended_doctor_name", "General Practitioner"),
                    "requires_inpatient": decision.get("requires_inpatient", False),
                    "severity_level": decision.get("severity_level", "medium"),
                    "reasoning": decision.get("reasoning", str(result)),
                }
            }
        else:
            # Fallback: agent did not call the submit tool → try to parse from text
            return {
                "status": "success",
                "analysis": {
                    "predicted_specialization": "Internal Medicine",
                    "recommended_doctor_id": None,
                    "recommended_doctor_name": "General Practitioner",
                    "requires_inpatient": False,
                    "severity_level": "medium",
                    "reasoning": str(result),
                }
            }

    except Exception as e:
        return {
            "status": "error",
            "analysis": {
                "predicted_specialization": "Internal Medicine",
                "recommended_doctor_id": None,
                "recommended_doctor_name": "General Practitioner",
                "requires_inpatient": False,
                "severity_level": "medium",
                "reasoning": f"AI Agent error: {str(e)}. Please perform manual triage.",
            }
        }
