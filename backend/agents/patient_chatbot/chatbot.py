import os

from openai import OpenAI
from database import supabase

CHATBOT_SYSTEM_PROMPT = """You are MediSync's Patient Health Assistant. You help patients understand their medical situation based on their doctor's diagnosis and notes.

<rules>
1. You ONLY answer based on the doctor's notes and medical data provided in the context below.
2. If no doctor's notes are available, tell the patient: "Your doctor hasn't provided any notes yet. Please wait for your examination to be completed, or contact the front office for more information."
3. NEVER invent or hallucinate medical information. Only use what the doctor has documented.
4. Explain medical terms in simple, patient-friendly language.
5. If the patient asks something not covered by the doctor's notes, say you can only provide information based on what the doctor has documented and suggest they contact their doctor directly.
6. Be empathetic, warm, and reassuring.
7. Keep responses concise and clear.
8. Respond in the same language the patient uses (English or Indonesian).
9. NEVER provide new diagnoses or change the doctor's assessment.
</rules>"""


def _get_ticket_context(ticket_id: str) -> dict:
    """Fetch the ticket and related medical context."""
    context = {"ticket": None, "patient_id": None, "has_doctor_notes": False}

    try:
        # Fetch the ticket with doctor info
        res = (
            supabase.table("tickets")
            .select(
                "id, patient_id, fo_note, doctor_note, status, severity_level, created_at, doctor_id"
            )
            .eq("id", ticket_id)
            .single()
            .execute()
        )

        ticket = res.data
        if not ticket:
            context["error"] = "Ticket not found."
            return context

        context["patient_id"] = ticket["patient_id"]

        # Resolve doctor info from profiles
        doc_name = "N/A"
        doc_spec = "N/A"
        if ticket.get("doctor_id"):
            doc_res = (
                supabase.table("profiles")
                .select("name, specialization")
                .eq("id", ticket["doctor_id"])
                .single()
                .execute()
            )
            if doc_res.data:
                doc_name = doc_res.data.get("name", "N/A")
                doc_spec = doc_res.data.get("specialization", "N/A")

        context["ticket"] = {
            "ticket_id": ticket["id"],
            "complaint": ticket.get("fo_note", ""),
            "doctor_diagnosis": ticket.get("doctor_note", ""),
            "doctor_name": doc_name,
            "specialization": doc_spec,
            "status": ticket["status"],
            "severity": ticket.get("severity_level", ""),
            "date": ticket.get("created_at", ""),
        }

        if ticket.get("doctor_note"):
            context["has_doctor_notes"] = True

        # Fetch patient history (other tickets)
        history_res = (
            supabase.table("tickets")
            .select(
                "id, fo_note, doctor_note, status, severity_level, created_at, doctor_id"
            )
            .eq("patient_id", ticket["patient_id"])
            .neq("id", ticket_id)
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )

        # Collect doctor IDs from history
        hist_doc_ids = list(set(
            h["doctor_id"] for h in (history_res.data or []) if h.get("doctor_id")
        ))
        hist_doc_map = {}
        if hist_doc_ids:
            hd_res = (
                supabase.table("profiles")
                .select("id, name, specialization")
                .in_("id", hist_doc_ids)
                .execute()
            )
            for d in hd_res.data or []:
                hist_doc_map[d["id"]] = {"name": d.get("name", "N/A"), "specialization": d.get("specialization", "N/A")}

        context["history"] = []
        for h in history_res.data or []:
            if h.get("doctor_note"):
                hd = hist_doc_map.get(h.get("doctor_id"), {})
                context["history"].append(
                    {
                        "complaint": h.get("fo_note", ""),
                        "doctor_diagnosis": h.get("doctor_note", ""),
                        "doctor_name": hd.get("name", "N/A"),
                        "specialization": hd.get("specialization", "N/A"),
                        "date": h.get("created_at", ""),
                    }
                )

        # Fetch prescriptions for this ticket
        pres_res = (
            supabase.table("prescriptions")
            .select("quantity, notes, medicine:catalog_medicines(name)")
            .eq("ticket_id", ticket_id)
            .execute()
        )
        context["prescriptions"] = pres_res.data or []

    except Exception as e:
        context["error"] = str(e)

    return context


def _get_chat_history(ticket_id: str, limit: int = 20) -> list:
    """Fetch recent chat history for context."""
    try:
        res = (
            supabase.table("chat_messages")
            .select("sender, message, created_at")
            .eq("ticket_id", ticket_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return res.data or []
    except Exception:
        return []


def chat_with_patient(ticket_id: str, message: str) -> dict:
    """
    Process a patient chat message and return AI response.

    Args:
        ticket_id: UUID of the ticket (belongs to one patient).
        message: The patient's chat message.
    """
    # Get ticket context
    context = _get_ticket_context(ticket_id)

    if context.get("error"):
        return {"status": "error", "message": context["error"]}

    if not context["has_doctor_notes"]:
        return {
            "status": "success",
            "reply": "Your doctor hasn't provided any notes yet. Please wait for your examination to be completed, or contact the front office for more information.",
            "has_context": False,
        }

    patient_id = context["patient_id"]
    ticket = context["ticket"]

    # Build context string for the AI
    context_str = "=== CURRENT VISIT ===\n\n"
    context_str += f"Date: {ticket['date']}\n"
    context_str += f"Doctor: {ticket['doctor_name']} ({ticket['specialization']})\n"
    context_str += f"Complaint: {ticket['complaint']}\n"
    context_str += f"Doctor's Diagnosis/Notes: {ticket['doctor_diagnosis']}\n"
    context_str += f"Severity: {ticket['severity']}\n"
    context_str += f"Status: {ticket['status']}\n\n"

    if context.get("prescriptions"):
        context_str += "--- Prescribed Medicines ---\n"
        for p in context["prescriptions"]:
            med_name = p.get("medicine", {}).get("name", "Unknown")
            context_str += (
                f"- {med_name}: {p['quantity']} units. Notes: {p.get('notes', '-')}\n"
            )
        context_str += "\n"

    if context.get("history"):
        context_str += "=== PAST VISITS ===\n\n"
        for h in context["history"]:
            context_str += f"Date: {h['date']}\n"
            context_str += f"Doctor: {h['doctor_name']} ({h['specialization']})\n"
            context_str += f"Complaint: {h['complaint']}\n"
            context_str += f"Diagnosis: {h['doctor_diagnosis']}\n\n"

    # Get chat history
    chat_history = _get_chat_history(ticket_id)

    # Build messages for LLM
    messages = [
        {"role": "system", "content": CHATBOT_SYSTEM_PROMPT + "\n\n" + context_str}
    ]

    for msg in chat_history:
        role = "user" if msg["sender"] == "patient" else "assistant"
        messages.append({"role": role, "content": msg["message"]})

    messages.append({"role": "user", "content": message})

    # Call LLM directly (no agent needed, just a simple chat)
    try:
        api_key = os.environ.get("AI_API_KEY", "")
        model_id = os.environ.get("AI_MODEL_ID")
        base_url = os.environ.get("AI_BASE_URL", "https://openrouter.ai/api/v1")

        client = OpenAI(api_key=api_key, base_url=base_url)
        response = client.chat.completions.create(
            model=model_id,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
        )

        reply = response.choices[0].message.content

        # Save both messages to chat_messages
        try:
            supabase.table("chat_messages").insert(
                [
                    {
                        "ticket_id": ticket_id,
                        "patient_id": patient_id,
                        "sender": "patient",
                        "message": message,
                    },
                    {
                        "ticket_id": ticket_id,
                        "patient_id": patient_id,
                        "sender": "ai",
                        "message": reply,
                    },
                ]
            ).execute()
        except Exception:
            pass  # Don't fail the response if chat persistence fails

        return {
            "status": "success",
            "reply": reply,
            "has_context": True,
            "ticket_id": ticket_id,
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Chat error: {str(e)}",
        }
