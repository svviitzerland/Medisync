"""
Doctor AI Assistant – direct-call approach.
Fetches all patient data upfront in Python, passes to the LLM as context,
and parses the structured JSON response. No agent tool loop.
"""

import json
from database import supabase


def _fetch_patient(nik: str) -> dict | None:
    try:
        res = (
            supabase.table("profiles")
            .select("id, name, age, nik, phone, email")
            .eq("nik", nik)
            .single()
            .execute()
        )
        return res.data
    except Exception:
        return None


def _fetch_current_ticket(patient_id: str) -> dict | None:
    try:
        res = (
            supabase.table("tickets")
            .select("id, fo_note, doctor_note, status, severity_level, ai_reasoning, created_at")
            .eq("patient_id", patient_id)
            .in_("status", ["in_progress"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return res.data[0] if res.data else None
    except Exception:
        return None


def _fetch_history(patient_id: str) -> list:
    try:
        res = (
            supabase.table("tickets")
            .select("id, fo_note, doctor_note, status, severity_level, created_at, doctor_id")
            .eq("patient_id", patient_id)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        doctor_ids = list(set(t["doctor_id"] for t in (res.data or []) if t.get("doctor_id")))
        doctor_map = {}
        if doctor_ids:
            doc_res = supabase.table("profiles").select("id, name, specialization").in_("id", doctor_ids).execute()
            for doc in doc_res.data or []:
                doctor_map[doc["id"]] = {"name": doc.get("name"), "specialization": doc.get("specialization")}

        history = []
        for t in res.data or []:
            doc = doctor_map.get(t.get("doctor_id"), {})
            history.append({
                "complaint": t.get("fo_note", ""),
                "diagnosis": t.get("doctor_note", ""),
                "doctor": doc.get("name", "N/A"),
                "specialization": doc.get("specialization", "N/A"),
                "status": t["status"],
                "severity": t.get("severity_level", ""),
                "date": t.get("created_at", ""),
            })
        return history
    except Exception:
        return []


def _fetch_medicines() -> list:
    try:
        res = (
            supabase.table("catalog_medicines")
            .select("id, name, price, stock")
            .gt("stock", 0)
            .order("name")
            .execute()
        )
        return res.data or []
    except Exception:
        return []


SYSTEM_PROMPT = """You are a Doctor AI Assistant at MediSync Hospital.
You help doctors by analyzing patient data and providing diagnostic suggestions.

You will receive all patient data in the user message. Respond with ONLY a valid JSON object (no markdown, no backticks) in this exact structure:

{
  "diagnosis": "Your diagnosis",
  "treatment_plan": "Your treatment plan",
  "medicines": [
    {"medicine_id": 1, "name": "Medicine Name", "quantity": 10, "notes": "Dosage instructions"}
  ],
  "reasoning": "Your clinical reasoning"
}

Rules:
- ONLY suggest medicines from the provided catalog (use exact medicine_id and name).
- Be concise but thorough.
- Use medical terminology and English.
- If the complaint is vague, still provide your best suggestion.
- The medicines array can be empty if no medication is needed.
"""


def get_doctor_suggestion(nik: str, doctor_draft: str = None) -> dict:
    """
    Fetches all data, sends to LLM, parses the structured response.
    """
    # 1. Fetch all data
    patient = _fetch_patient(nik)
    if not patient:
        return {"status": "error", "message": f"Patient not found with NIK {nik}"}

    ticket = _fetch_current_ticket(patient["id"])
    history = _fetch_history(patient["id"])
    medicines = _fetch_medicines()

    # 2. Build context prompt
    prompt = f"""## Patient
Name: {patient['name']}, Age: {patient.get('age', 'N/A')}, NIK: {patient['nik']}

## Current Complaint
{json.dumps(ticket, indent=2, ensure_ascii=False, default=str) if ticket else "No active ticket found."}

## Medical History
{json.dumps(history, indent=2, ensure_ascii=False, default=str) if history else "No previous history."}

## Available Medicine Catalog
{json.dumps(medicines, indent=2, ensure_ascii=False)}
"""

    if doctor_draft:
        prompt += f"""
## Doctor's Draft Notes
{doctor_draft}

Review and enhance these notes. Keep the doctor's intent but add anything missed.
"""
    else:
        prompt += """
The doctor has not written notes yet. Provide a comprehensive diagnostic suggestion.
"""

    # 3. Call LLM directly (no agent, no tools)
    try:
        import os
        from openai import OpenAI

        client = OpenAI(
            api_key=os.environ.get("AI_API_KEY", ""),
            base_url=os.environ.get("AI_BASE_URL", "https://openrouter.ai/api/v1"),
        )

        response = client.chat.completions.create(
            model=os.environ.get("AI_MODEL_ID", ""),
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )

        raw_text = response.choices[0].message.content or ""

        # Parse JSON response
        # Strip markdown code fences if present
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

        suggestion = json.loads(cleaned)

        # Validate medicines against catalog
        catalog_ids = {m["id"] for m in medicines}
        valid_medicines = []
        for med in suggestion.get("medicines", []):
            if med.get("medicine_id") in catalog_ids:
                valid_medicines.append({
                    "medicine_id": med["medicine_id"],
                    "name": med.get("name", ""),
                    "quantity": med.get("quantity", 1),
                    "notes": med.get("notes", ""),
                })

        return {
            "status": "success",
            "suggestion": {
                "diagnosis": suggestion.get("diagnosis", ""),
                "treatment_plan": suggestion.get("treatment_plan", ""),
                "medicines": valid_medicines,
                "requires_inpatient": False,
                "reasoning": suggestion.get("reasoning", ""),
            },
        }

    except json.JSONDecodeError:
        # LLM didn't return valid JSON, use raw text as reasoning
        return {
            "status": "success",
            "suggestion": {
                "diagnosis": "",
                "treatment_plan": "",
                "medicines": [],
                "requires_inpatient": False,
                "reasoning": raw_text if raw_text else "AI could not generate a structured response.",
            },
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"AI Assistant error: {str(e)}. Please proceed manually.",
        }
