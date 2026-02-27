import json
from strands import Agent, tool

from agents.core.llm import create_model

SYSTEM_PROMPT = """You are a medical AI assistant responsible for summarizing pre-consultation patient assessments.
Your task is to analyze the Q&A history between the triage agent and the patient, and generate a concise, professional summary that will serve as the Front Office (FO) note for the doctor.

<rules>
1. Provide a concise medical summary of the patient's complaints and symptoms.
2. The summary MUST be in English.
3. Be objective and factual based ONLY on the provided Q&A history. Do not invent details.
4. You MUST call the `submit_summary` tool to output your generated summary.
</rules>
"""

@tool
def submit_summary(summary: str) -> str:
    """
    Submit the generated medical summary.
    MUST be called as the final step.

    Args:
        summary: A concise, professional medical summary of the patient's condition based on the Q&A.
                 Example: "Patient reports a severe, throbbing headache for 3 days, accompanied by nausea and sensitivity to light. No history of migraines."
    
    Returns:
        Confirmation that the summary was captured.
    """
    return json.dumps({"status": "summary_captured", "summary": summary}, ensure_ascii=False)


def create_summary_agent():
    """Creates an instance of the Strands Agent for summarizing Q&A history."""
    model = create_model()
    agent = Agent(
        model=model,
        system_prompt=SYSTEM_PROMPT,
        tools=[submit_summary],
    )
    return agent


def summarize_qa_history(qa_history: list) -> dict:
    """
    Generate a summary from the Q&A history.
    """
    agent = create_summary_agent()

    # Format the Q&A history for the prompt
    formatted_history = "\n".join([f"**{msg['role'].capitalize()}**: {msg['content']}" for msg in qa_history])

    # Build prompt
    prompt = f"""**Patient Q&A History:**
<qa_history>
{formatted_history}
</qa_history>

Please generate a concise medical summary and submit it using the `submit_summary` tool."""

    try:
        result = agent(prompt)

        # Search for tool result from submit_summary in messages
        messages = agent.messages
        summary_payload = None

        for msg in reversed(messages):
            if isinstance(msg, dict) and msg.get("role") == "assistant":
                for block in msg.get("content", []):
                    if isinstance(block, dict):
                        if block.get("toolUse", {}).get("name") == "submit_summary":
                            summary_payload = block["toolUse"].get("input", {})
                            break
            if summary_payload:
                break

        if summary_payload and "summary" in summary_payload:
            return {
                "status": "success",
                "summary": summary_payload["summary"]
            }
        else:
            # Fallback if the agent fails to call the tool correctly
            return {
                "status": "success",  # Return success with raw response as fallback so it doesn't break
                "summary": str(result).strip()
            }

    except Exception as e:
        return {
            "status": "error",
            "message": f"AI Agent error: {str(e)}",
        }
