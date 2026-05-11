from __future__ import annotations

from app.llm.providers.base import BaseModelProvider


class GroqProvider(BaseModelProvider):
    provider_name = "groq"

    def get_model_descriptions(self) -> dict[str, str]:
        return {
            "llama-3.1-8b-instant": "Fast Groq-hosted Llama model for lightweight text inference.",
            "llama-3.3-70b-versatile": "Larger Groq-hosted Llama model for higher quality responses.",
        }

    def build_headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
