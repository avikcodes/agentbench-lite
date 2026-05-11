from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import PlainTextResponse, Response

from app.schemas.analytics import AnalyticsSummary, TrendAnalysis
from app.schemas.evaluation import (
    CompareBenchmarksRequest,
    EvaluationComparisonResult,
)
from app.services.analytics_service import (
    AnalyticsServiceError,
    analytics_service,
)
from app.services.export_service import (
    ExportServiceError,
    export_service,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary() -> AnalyticsSummary:
    try:
        return await analytics_service.get_summary()
    except AnalyticsServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.post("/compare", response_model=EvaluationComparisonResult)
async def compare_benchmarks(
    request: CompareBenchmarksRequest,
) -> EvaluationComparisonResult:
    try:
        return await analytics_service.compare(
            benchmark_ids=request.benchmark_ids,
        )
    except AnalyticsServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get("/trends", response_model=TrendAnalysis)
async def get_trend_analysis(
    model_name: str | None = Query(None),
) -> TrendAnalysis:
    try:
        return await analytics_service.get_trends(model_name=model_name)
    except AnalyticsServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.get("/export/benchmark/{benchmark_id}")
async def export_benchmark_report(
    benchmark_id: str,
    format: str = Query("json", pattern="^(json|csv)$"),
):
    try:
        if format == "csv":
            content = await export_service.export_benchmark_csv(benchmark_id)
            return PlainTextResponse(
                content=content,
                media_type="text/csv",
                headers={
                    "Content-Disposition": f'attachment; filename="benchmark_{benchmark_id}.csv"'
                },
            )
        content = await export_service.export_benchmark_json(benchmark_id)
        return Response(
            content=content,
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="benchmark_{benchmark_id}.json"'
            },
        )
    except ExportServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get("/export/execution/{execution_id}")
async def export_execution_report(
    execution_id: str,
    format: str = Query("json", pattern="^(json|csv)$"),
):
    try:
        if format == "csv":
            content = await export_service.export_execution_csv(execution_id)
            return PlainTextResponse(
                content=content,
                media_type="text/csv",
                headers={
                    "Content-Disposition": f'attachment; filename="execution_{execution_id}.csv"'
                },
            )
        content = await export_service.export_execution_json(execution_id)
        return Response(
            content=content,
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="execution_{execution_id}.json"'
            },
        )
    except ExportServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get("/export/evaluation/{execution_id}")
async def export_evaluation_report(
    execution_id: str,
    task_id: str | None = Query(None),
    dataset_id: str | None = Query(None),
    format: str = Query("json", pattern="^(json|csv)$"),
):
    try:
        if format == "csv":
            content = await export_service.export_evaluation_csv(
                execution_id, task_id, dataset_id
            )
            return PlainTextResponse(
                content=content,
                media_type="text/csv",
                headers={
                    "Content-Disposition": f'attachment; filename="evaluation_{execution_id}.csv"'
                },
            )
        content = await export_service.export_evaluation_json(
            execution_id, task_id, dataset_id
        )
        return Response(
            content=content,
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="evaluation_{execution_id}.json"'
            },
        )
    except ExportServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
