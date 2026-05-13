from fastapi import APIRouter, HTTPException, status

from app.schemas.benchmark import BenchmarkTask, DatasetSummary
from app.schemas.execution import BenchmarkRunRequest, BenchmarkRunState
from app.services.benchmark_run_service import (
    BenchmarkRunNotFoundError,
    benchmark_run_service,
)
from app.services.dataset_service import (
    DatasetNotFoundError,
    DatasetServiceError,
    DatasetValidationError,
    TaskNotFoundError,
    dataset_service,
)

router = APIRouter(prefix="/benchmarks", tags=["benchmarks"])


@router.get("/datasets", response_model=list[DatasetSummary])
async def list_datasets() -> list[DatasetSummary]:
    try:
        return await dataset_service.list_datasets()
    except DatasetValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except DatasetServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load datasets.",
        ) from exc


@router.get("/datasets/{dataset_id}/tasks", response_model=list[BenchmarkTask])
async def get_dataset_tasks(dataset_id: str) -> list[BenchmarkTask]:
    try:
        return await dataset_service.get_dataset_tasks(dataset_id)
    except DatasetNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except DatasetValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.get(
    "/datasets/{dataset_id}/tasks/{task_id}",
    response_model=BenchmarkTask,
)
async def get_dataset_task(dataset_id: str, task_id: str) -> BenchmarkTask:
    try:
        return await dataset_service.get_task(dataset_id, task_id)
    except DatasetNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except TaskNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except DatasetValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.post("/runs", response_model=BenchmarkRunState, status_code=status.HTTP_202_ACCEPTED)
async def create_benchmark_run(request: BenchmarkRunRequest) -> BenchmarkRunState:
    try:
        return await benchmark_run_service.create_run(request)
    except DatasetNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except DatasetValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.get("/runs/{run_id}", response_model=BenchmarkRunState)
async def get_benchmark_run(run_id: str) -> BenchmarkRunState:
    try:
        return await benchmark_run_service.get_run(run_id)
    except BenchmarkRunNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get("/runs/{run_id}/status", response_model=BenchmarkRunState)
async def get_benchmark_run_status(run_id: str) -> BenchmarkRunState:
    return await get_benchmark_run(run_id)


@router.post("/runs/{run_id}/retry", response_model=BenchmarkRunState, status_code=status.HTTP_202_ACCEPTED)
async def retry_benchmark_run(run_id: str) -> BenchmarkRunState:
    try:
        return await benchmark_run_service.retry_failed_tasks(run_id)
    except BenchmarkRunNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except DatasetNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
