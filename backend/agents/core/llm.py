import os
from strands.models.openai import OpenAIModel


def create_model():
    """Create a model using OpenAI-compatible API.
    Configuration from .env:
      - AI_API_KEY: API key for the AI provider
      - AI_MODEL_ID: Model being used
      - AI_BASE_URL: Base URL for the API (default: https://openrouter.ai/api/v1)
    """
    api_key = os.environ.get("AI_API_KEY", "")
    model_id = os.environ.get("AI_MODEL_ID")
    base_url = os.environ.get("AI_BASE_URL", "https://openrouter.ai/api/v1")

    if not api_key:
        raise ValueError("AI_API_KEY is not set in .env!")

    return OpenAIModel(
        client_args={
            "api_key": api_key,
            "base_url": base_url,
        },
        model_id=model_id,
    )
