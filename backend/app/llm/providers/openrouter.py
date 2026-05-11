from __future__ import annotations

from app.llm.providers.base import BaseModelProvider


class OpenRouterProvider(BaseModelProvider):
    provider_name = "openrouter"

    def __init__(
        self,
        api_key: str,
        base_url: str,
        timeout_seconds: float,
        site_url: str,
        app_name: str,
    ) -> None:
        super().__init__(api_key=api_key, base_url=base_url, timeout_seconds=timeout_seconds)
        self.site_url = site_url
        self.app_name = app_name

    def get_model_descriptions(self) -> dict[str, str]:
        return {
            "openai/gpt-4o-mini": "Small OpenAI model exposed through OpenRouter for quick responses.",
            "meta-llama/llama-3.1-8b-instruct": "Instruction-tuned Llama model exposed through OpenRouter.",
        }

    def build_headers(self) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-Title": self.app_name,
        }
        if self.site_url:
            headers["HTTP-Referer"] = self.site_url
        return headers
