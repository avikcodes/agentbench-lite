from __future__ import annotations

from abc import ABC, abstractmethod
from time import perf_counter
from typing import Any

import httpx

from app.schemas.llm import ModelInferenceRequest, ModelInferenceResponse, TokenUsage


class ProviderConfigurationError(Exception):
    """Raised when provider configuration is missing or invalid."""


class ProviderRequestError(Exception):
    """Raised when the upstream model provider request fails."""


class ProviderTimeoutError(Exception):
    """Raised when the upstream model provider times out."""


class BaseModelProvider(ABC):
    provider_name: str
    base_url: str
    timeout_seconds: float

    def __init__(self, api_key: str, base_url: str, timeout_seconds: float) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds

    def is_configured(self) -> bool:
        return bool(self.api_key)

    @abstractmethod
    def get_model_descriptions(self) -> dict[str, str]:
        raise NotImplementedError

    @abstractmethod
    def build_headers(self) -> dict[str, str]:
        raise NotImplementedError

    async def generate(self, request: ModelInferenceRequest) -> ModelInferenceResponse:
        if not self.is_configured():
            raise ProviderConfigurationError(
                f"Provider '{self.provider_name}' is not configured."
            )

        payload = self.build_payload(request)
        start_time = perf_counter()

        try:
            data = await self._request_completion(payload)
        except httpx.TimeoutException as exc:
            raise ProviderTimeoutError(
                f"Request to provider '{self.provider_name}' timed out."
            ) from exc
        except httpx.HTTPStatusError as exc:
            message = exc.response.text or exc.response.reason_phrase
            raise ProviderRequestError(
                f"Provider '{self.provider_name}' request failed: {message}"
            ) from exc
        except httpx.HTTPError as exc:
            raise ProviderRequestError(
                f"Provider '{self.provider_name}' request failed."
            ) from exc

        latency = round(perf_counter() - start_time, 6)
        return self.normalize_response(request, data, latency)

    def build_payload(self, request: ModelInferenceRequest) -> dict[str, Any]:
        return {
            "model": request.model_name,
            "messages": [{"role": "user", "content": request.prompt}],
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
        }

    async def _request_completion(self, payload: dict[str, Any]) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self.build_headers(),
                json=payload,
            )
            response.raise_for_status()
            return response.json()

    def normalize_response(
        self,
        request: ModelInferenceRequest,
        data: dict[str, Any],
        latency: float,
    ) -> ModelInferenceResponse:
        content = self._extract_message_content(data)
        usage = self._extract_token_usage(data)

        return ModelInferenceResponse(
            model_name=request.model_name,
            provider=request.provider,
            prompt=request.prompt,
            response=content,
            latency=latency,
            token_usage=usage,
            status="success",
        )

    def _extract_message_content(self, data: dict[str, Any]) -> str:
        choices = data.get("choices", [])
        if not choices:
            raise ProviderRequestError("Provider response did not include choices.")

        message = choices[0].get("message", {})
        content = message.get("content", "")
        if isinstance(content, list):
            text_parts = [
                item.get("text", "")
                for item in content
                if isinstance(item, dict) and item.get("type") == "text"
            ]
            content = "".join(text_parts)

        if not isinstance(content, str) or not content.strip():
            raise ProviderRequestError("Provider response did not include text content.")

        return content.strip()

    def _extract_token_usage(self, data: dict[str, Any]) -> TokenUsage:
        usage = data.get("usage", {})
        return TokenUsage(
            prompt_tokens=int(usage.get("prompt_tokens", 0) or 0),
            completion_tokens=int(usage.get("completion_tokens", 0) or 0),
            total_tokens=int(usage.get("total_tokens", 0) or 0),
        )
