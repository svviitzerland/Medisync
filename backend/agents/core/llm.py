import os
from strands.models.openai import OpenAIModel

def create_model():
    """Create a model using OpenRouter (OpenAI-compatible API).
    Configuration from .env:
      - OPENROUTER_API_KEY: API key from openrouter.ai
      - AI_MODEL_ID: Model being used (default: google/gemini-2.0-flash-001)
    """
    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    model_id = os.environ.get("AI_MODEL_ID")

    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is not set in .env! Get it at https://openrouter.ai/keys")

    return OpenAIModel(
        client_args={
            "api_key": api_key,
            "base_url": "https://openrouter.ai/api/v1",
        },
        model_id=model_id,
    )
