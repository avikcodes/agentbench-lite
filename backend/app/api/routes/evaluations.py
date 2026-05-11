from fastapi import APIRouter, HTTPException, status

from app.schemas.evaluation import (
    BenchmarkEvaluationResult,
    CompareBenchmarksRequest,
    EvaluationComparisonResult,
    EvaluateBenchmarkRunRequest,
    EvaluateSingleRequest,
    MetricBreakdown,
    TaskEvaluationResult,
)
from app.services.evaluation_service import (
    EvaluationServiceError,
    ExecutionNotFoundError,
    TaskNotFoundError,
    evaluation_service,
)
from app.services.evaluation_store_service import (
    EvaluationNotFoundError,
    evaluation_store_service,
)

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


@router.post(
    "/tasks",
    response_model=TaskEvaluationResult,
)
async def evaluate_single_execution(
    request: EvaluateSingleRequest,
) -> TaskEvaluationResult:
    try:
        return await evaluation_service.evaluate_single(
            execution_id=request.execution_id,
            task_id=request.task_id,
            dataset_id=request.dataset_id,
            weight_config=request.weight_config,
        )
    except ExecutionNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except TaskNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except EvaluationServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.post(
    "/benchmarks/runs",
    response_model=BenchmarkEvaluationResult,
)
async def evaluate_benchmark_run(
    request: EvaluateBenchmarkRunRequest,
) -> BenchmarkEvaluationResult:
    try:
        return await evaluation_service.evaluate_benchmark_run(
            execution_ids=request.execution_ids,
            model_name=request.model_name,
            dataset_id=request.dataset_id,
            weight_config=request.weight_config,
        )
    except ExecutionNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except TaskNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except EvaluationServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.get(
    "/benchmarks/{benchmark_id}",
    response_model=BenchmarkEvaluationResult,
)
async def get_benchmark_summary(
    benchmark_id: str,
) -> BenchmarkEvaluationResult:
    try:
        return await evaluation_service.get_benchmark_result(benchmark_id)
    except EvaluationServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "/tasks/{execution_id}",
    response_model=TaskEvaluationResult,
)
async def get_task_evaluation_details(
    execution_id: str,
    task_id: str | None = None,
    dataset_id: str | None = None,
) -> TaskEvaluationResult:
    resolved_task_id = task_id or execution_id
    try:
        return await evaluation_service.evaluate_single(
            execution_id=execution_id,
            task_id=resolved_task_id,
            dataset_id=dataset_id,
        )
    except ExecutionNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except EvaluationServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.get(
    "/metrics/{execution_id}",
    response_model=MetricBreakdown,
)
async def get_evaluation_metrics(
    execution_id: str,
    task_id: str | None = None,
    dataset_id: str | None = None,
) -> MetricBreakdown:
    resolved_task_id = task_id or execution_id
    try:
        result = await evaluation_service.evaluate_single(
            execution_id=execution_id,
            task_id=resolved_task_id,
            dataset_id=dataset_id,
        )
        return result.metric_breakdown
    except ExecutionNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except EvaluationServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.post(
    "/benchmarks/compare",
    response_model=EvaluationComparisonResult,
)
async def compare_benchmark_results(
    request: CompareBenchmarksRequest,
) -> EvaluationComparisonResult:
    try:
        return await evaluation_service.compare_benchmarks(
            benchmark_ids=request.benchmark_ids,
        )
    except EvaluationServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "/evaluators",
    response_model=list[dict[str, str]],
)
async def list_evaluators() -> list[dict[str, str]]:
    return evaluation_service.list_evaluators()


@router.get(
    "/benchmarks",
    response_model=list[BenchmarkEvaluationResult],
)
async def list_benchmark_results() -> list[BenchmarkEvaluationResult]:
    try:
        return await evaluation_service.list_evaluation_results()
    except EvaluationServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
