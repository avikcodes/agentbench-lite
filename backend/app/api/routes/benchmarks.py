from fastapi import APIRouter, HTTPException, status

from app.schemas.benchmark import BenchmarkTask, DatasetSummary
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
