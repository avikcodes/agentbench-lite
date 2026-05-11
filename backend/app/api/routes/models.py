from fastapi import APIRouter, HTTPException, status

from app.schemas.llm import ModelInferenceRequest, ModelInferenceResponse, ModelMetadata
from app.services.model_service import (
    ModelInferenceError,
    ModelNotFoundError,
    ModelTimeoutError,
    ModelUnavailableError,
    model_service,
)

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=list[ModelMetadata])
async def list_models() -> list[ModelMetadata]:
    return await model_service.list_models()


@router.post("/inference", response_model=ModelInferenceResponse)
async def run_inference(request: ModelInferenceRequest) -> ModelInferenceResponse:
    try:
        return await model_service.infer(request)
    except ModelNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ModelUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except ModelTimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(exc),
        ) from exc
    except ModelInferenceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc


@router.get("/{provider}/{model_name:path}", response_model=ModelMetadata)
async def get_model_metadata(provider: str, model_name: str) -> ModelMetadata:
    try:
        return await model_service.get_model(provider, model_name)
    except ModelNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
