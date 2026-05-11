from __future__ import annotations

from app.llm.config import settings
from app.llm.providers.groq import GroqProvider
from app.llm.providers.openrouter import OpenRouterProvider
from app.schemas.llm import ModelMetadata


class ModelRegistry:
    def __init__(self) -> None:
        self.providers = {
            "groq": GroqProvider(
                api_key=settings.groq_api_key,
                base_url=settings.groq_base_url,
                timeout_seconds=settings.groq_timeout,
            ),
            "openrouter": OpenRouterProvider(
                api_key=settings.openrouter_api_key,
                base_url=settings.openrouter_base_url,
                timeout_seconds=settings.openrouter_timeout,
                site_url=settings.openrouter_site_url,
                app_name=settings.openrouter_app_name,
            ),
        }
        self._models = self._build_model_metadata()

    def list_models(self) -> list[ModelMetadata]:
        return sorted(
            self._models.values(),
            key=lambda model: (model.provider, model.model_name),
        )

    def get_model(self, provider: str, model_name: str) -> ModelMetadata | None:
        return self._models.get((provider, model_name))

    def get_provider(self, provider: str):
        return self.providers.get(provider)

    def _build_model_metadata(self) -> dict[tuple[str, str], ModelMetadata]:
        models: dict[tuple[str, str], ModelMetadata] = {}

        for model_name in settings.groq_models:
            provider = self.providers["groq"]
            description = provider.get_model_descriptions().get(
                model_name,
                "Groq model configured for unified inference access.",
            )
            models[("groq", model_name)] = ModelMetadata(
                provider="groq",
                model_name=model_name,
                description=description,
                enabled=provider.is_configured(),
                base_url=provider.base_url,
                timeout_seconds=provider.timeout_seconds,
            )

        for model_name in settings.openrouter_models:
            provider = self.providers["openrouter"]
            description = provider.get_model_descriptions().get(
                model_name,
                "OpenRouter model configured for unified inference access.",
            )
            models[("openrouter", model_name)] = ModelMetadata(
                provider="openrouter",
                model_name=model_name,
                description=description,
                enabled=provider.is_configured(),
                base_url=provider.base_url,
                timeout_seconds=provider.timeout_seconds,
            )

        return models


model_registry = ModelRegistry()
