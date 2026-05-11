from __future__ import annotations

import csv
import io
import json
from datetime import datetime

from app.services.evaluation_service import evaluation_service
from app.services.execution_store_service import execution_store_service


class ExportServiceError(Exception):
    """Base exception for export service failures."""


def _to_dict(obj: object) -> dict:
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if isinstance(obj, dict):
        return obj
    return {}


class ExportService:
    async def export_benchmark_json(self, benchmark_id: str) -> str:
        try:
            result = await evaluation_service.get_benchmark_result(benchmark_id)
        except Exception as exc:
            raise ExportServiceError(
                f"Benchmark '{benchmark_id}' not found."
            ) from exc
        return json.dumps(_to_dict(result), indent=2, default=str)

    async def export_benchmark_csv(self, benchmark_id: str) -> str:
        try:
            result = await evaluation_service.get_benchmark_result(benchmark_id)
        except Exception as exc:
            raise ExportServiceError(
                f"Benchmark '{benchmark_id}' not found."
            ) from exc

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "task_id",
                "execution_id",
                "category",
                "difficulty",
                "score",
                "passed",
                "primary_failure",
                "failure_count",
            ]
        )
        for task in result.task_results:
            writer.writerow(
                [
                    task.task_id,
                    task.execution_id,
                    task.category or "",
                    task.difficulty or "",
                    f"{task.score:.4f}",
                    "Yes" if task.passed else "No",
                    task.failure_analysis.primary_failure.value,
                    task.failure_analysis.failure_count,
                ]
            )
        return output.getvalue()

    async def export_execution_json(self, execution_id: str) -> str:
        try:
            result = await execution_store_service.get_result(execution_id)
        except Exception as exc:
            raise ExportServiceError(
                f"Execution '{execution_id}' not found."
            ) from exc
        return json.dumps(_to_dict(result), indent=2, default=str)

    async def export_execution_csv(self, execution_id: str) -> str:
        try:
            result = await execution_store_service.get_result(execution_id)
        except Exception as exc:
            raise ExportServiceError(
                f"Execution '{execution_id}' not found."
            ) from exc

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "step",
                "status",
                "tool",
                "latency",
                "error",
                "reasoning_preview",
            ]
        )
        for step in result.execution_trace:
            writer.writerow(
                [
                    step.step_number,
                    step.status,
                    step.selected_tool or "(final answer)",
                    f"{step.latency:.4f}",
                    step.error_message or "",
                    step.reasoning_step[:120].replace("\n", " "),
                ]
            )
        return output.getvalue()

    async def export_evaluation_json(
        self,
        execution_id: str,
        task_id: str | None = None,
        dataset_id: str | None = None,
    ) -> str:
        try:
            result = await evaluation_service.evaluate_single(
                execution_id=execution_id,
                task_id=task_id or execution_id,
                dataset_id=dataset_id,
            )
        except Exception as exc:
            raise ExportServiceError(
                f"Evaluation for execution '{execution_id}' failed."
            ) from exc
        return json.dumps(_to_dict(result), indent=2, default=str)

    async def export_evaluation_csv(
        self,
        execution_id: str,
        task_id: str | None = None,
        dataset_id: str | None = None,
    ) -> str:
        try:
            result = await evaluation_service.evaluate_single(
                execution_id=execution_id,
                task_id=task_id or execution_id,
                dataset_id=dataset_id,
            )
        except Exception as exc:
            raise ExportServiceError(
                f"Evaluation for execution '{execution_id}' failed."
            ) from exc

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["metric_name", "value", "weight", "normalized"])
        for name, metric in result.metric_breakdown.metrics.items():
            writer.writerow(
                [
                    name,
                    f"{metric.value:.4f}",
                    f"{metric.weight:.4f}",
                    "Yes" if metric.normalized else "No",
                ]
            )

        writer.writerow([])
        writer.writerow(["overall_score", f"{result.score:.4f}"])
        writer.writerow(["passed", "Yes" if result.passed else "No"])
        writer.writerow(
            ["primary_failure", result.failure_analysis.primary_failure.value]
        )
        return output.getvalue()


export_service = ExportService()
