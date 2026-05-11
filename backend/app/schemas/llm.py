from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


ModelProviderName = Literal["groq", "openrouter"]
ModelResponseStatus = Literal["success", "error"]


class TokenUsage(BaseModel):
    prompt_tokens: int = Field(default=0, ge=0)
    completion_tokens: int = Field(default=0, ge=0)
    total_tokens: int = Field(default=0, ge=0)


class ModelMetadata(BaseModel):
    provider: ModelProviderName
    model_name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    enabled: bool
    base_url: str = Field(..., min_length=1)
    timeout_seconds: float = Field(..., gt=0)


class ModelInferenceRequest(BaseModel):
    provider: ModelProviderName
    model_name: str = Field(..., min_length=1)
    prompt: str = Field(..., min_length=1)
    temperature: float = Field(default=0.2, ge=0, le=2)
    max_tokens: int = Field(default=512, ge=1, le=4096)


class ModelInferenceResponse(BaseModel):
    model_name: str = Field(..., min_length=1)
    provider: ModelProviderName
    prompt: str = Field(..., min_length=1)
    response: str = Field(..., min_length=1)
    latency: float = Field(..., ge=0)
    token_usage: TokenUsage
    status: ModelResponseStatus
