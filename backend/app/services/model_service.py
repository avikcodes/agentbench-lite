from __future__ import annotations

from app.llm.registry import model_registry
from app.llm.providers.base import (
    ProviderConfigurationError,
    ProviderRequestError,
    ProviderTimeoutError,
)
from app.schemas.llm import ModelInferenceRequest, ModelInferenceResponse, ModelMetadata


class ModelServiceError(Exception):
    """Base exception for model service failures."""


class ModelNotFoundError(ModelServiceError):
    """Raised when a model is not registered."""


class ModelUnavailableError(ModelServiceError):
    """Raised when a model provider is not configured."""


class ModelInferenceError(ModelServiceError):
    """Raised when a provider request fails."""


class ModelTimeoutError(ModelServiceError):
    """Raised when a provider request times out."""


class ModelService:
    def __init__(self) -> None:
        self.registry = model_registry

    async def list_models(self) -> list[ModelMetadata]:
        return self.registry.list_models()

    async def get_model(self, provider: str, model_name: str) -> ModelMetadata:
        model = self.registry.get_model(provider, model_name)
        if model is None:
            raise ModelNotFoundError(
                f"Model '{model_name}' was not found for provider '{provider}'."
            )
        return model

    async def infer(self, request: ModelInferenceRequest) -> ModelInferenceResponse:
        model = await self.get_model(request.provider, request.model_name)
        provider = self.registry.get_provider(request.provider)

        if provider is None:
            raise ModelNotFoundError(
                f"Provider '{request.provider}' is not registered."
            )
        if not model.enabled:
            raise ModelUnavailableError(
                f"Provider '{request.provider}' is not configured. Add the required API key."
            )

        try:
            return await provider.generate(request)
        except ProviderConfigurationError as exc:
            raise ModelUnavailableError(str(exc)) from exc
        except ProviderTimeoutError as exc:
            raise ModelTimeoutError(str(exc)) from exc
        except ProviderRequestError as exc:
            raise ModelInferenceError(str(exc)) from exc


model_service = ModelService()
