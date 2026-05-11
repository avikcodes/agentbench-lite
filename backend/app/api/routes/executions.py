from fastapi import APIRouter, HTTPException, status

from app.schemas.execution import (
    AgentExecutionResult,
    BenchmarkTaskExecutionRequest,
    CustomTaskExecutionRequest,
    ExecutionTraceResponse,
)
from app.services.dataset_service import (
    DatasetNotFoundError,
    DatasetValidationError,
    TaskNotFoundError,
)
from app.services.execution_store_service import (
    ExecutionNotFoundError,
    execution_store_service,
)
from app.services.model_service import (
    ModelInferenceError,
    ModelNotFoundError,
    ModelTimeoutError,
    ModelUnavailableError,
)
from app.services.task_runner_service import task_runner_service

router = APIRouter(prefix="/executions", tags=["executions"])


@router.post(
    "/benchmarks/{dataset_id}/tasks/{task_id}",
    response_model=AgentExecutionResult,
)
async def run_benchmark_task(
    dataset_id: str,
    task_id: str,
    request: BenchmarkTaskExecutionRequest,
) -> AgentExecutionResult:
    try:
        return await task_runner_service.run_benchmark_task(dataset_id, task_id, request)
    except DatasetNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except DatasetValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except ModelNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
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


@router.post("/custom", response_model=AgentExecutionResult)
async def run_custom_task(
    request: CustomTaskExecutionRequest,
) -> AgentExecutionResult:
    try:
        return await task_runner_service.run_custom_task(request)
    except ModelNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
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


@router.get("/{execution_id}", response_model=AgentExecutionResult)
async def get_execution_result(execution_id: str) -> AgentExecutionResult:
    try:
        return await execution_store_service.get_result(execution_id)
    except ExecutionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{execution_id}/trace", response_model=ExecutionTraceResponse)
async def get_execution_trace(execution_id: str) -> ExecutionTraceResponse:
    try:
        return await execution_store_service.get_trace(execution_id)
    except ExecutionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
