import json
from strands import Agent, tool
from agents.core.llm import create_model

SYSTEM_PROMPT = """You are an AI triage assistant for a hospital.
Your goal is to ask 3-5 relevant follow-up questions based on the patient's initial complaint.
These questions will help the specialist doctor understand the patient's condition better before the actual consultation.

<rules>
1. Ask exactly 3 to 5 questions.
2. Questions must be highly relevant to the initial complaint.
3. Keep questions clear and easy to understand for a general patient.
4. You MUST call the `submit_questions` tool to output your generated questions.
</rules>
"""

@tool
def submit_questions(questions: list[str]) -> str:
    """
    Submit the generated follow-up questions.
    MUST be called as the final step.

    Args:
        questions: A list of 3 to 5 strings, where each string is a follow-up question.
                   Example: ["How long have you had the headache?", "Is it severe?"]
    
    Returns:
        Confirmation that questions were captured.
    """
    return json.dumps({"status": "questions_captured", "questions": questions}, ensure_ascii=False)


def create_questions_agent():
    """Creates an instance of the Strands Agent for generating triage questions."""
    model = create_model()
    agent = Agent(
        model=model,
        system_prompt=SYSTEM_PROMPT,
        tools=[submit_questions],
    )
    return agent


def generate_pre_assessment_questions(complaint: str) -> dict:
    """
    Generate a list of follow-up questions based on the patient's initial complaint.
    """
    agent = create_questions_agent()

    # Build prompt
    prompt = f"""**Patient Initial Complaint:**
<complaint>
{complaint}
</complaint>

Please generate 3-5 follow-up questions and submit them using the `submit_questions` tool."""

    try:
        result = agent(prompt)

        # Search for tool result from submit_questions in messages
        messages = agent.messages
        questions_payload = None

        for msg in reversed(messages):
            if isinstance(msg, dict) and msg.get("role") == "assistant":
                for block in msg.get("content", []):
                    if isinstance(block, dict):
                        if block.get("toolUse", {}).get("name") == "submit_questions":
                            questions_payload = block["toolUse"].get("input", {})
                            break
            if questions_payload:
                break

        if questions_payload and "questions" in questions_payload:
            return {
                "status": "success",
                "questions": questions_payload["questions"]
            }
        else:
            # Fallback if the agent fails to call the tool correctly
            return {
                "status": "error",
                "message": "AI failed to format questions properly. Please try again.",
                "raw_response": str(result)
            }

    except Exception as e:
        return {
            "status": "error",
            "message": f"AI Agent error: {str(e)}",
        }
