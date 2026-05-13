from __future__ import annotations

import json
from pathlib import Path

import aiofiles
from pydantic import ValidationError

from app.schemas.benchmark import BenchmarkDataset, BenchmarkTask, DatasetSummary

BASE_DIR = Path(__file__).resolve().parents[2]
DATASETS_DIR = BASE_DIR / "datasets"


class DatasetServiceError(Exception):
    """Base exception for dataset service failures."""


class DatasetNotFoundError(DatasetServiceError):
    """Raised when a dataset file does not exist."""


class TaskNotFoundError(DatasetServiceError):
    """Raised when a task does not exist in a dataset."""


class DatasetValidationError(DatasetServiceError):
    """Raised when a dataset file is malformed."""


class DatasetService:
    def __init__(self, datasets_dir: Path = DATASETS_DIR) -> None:
        self.datasets_dir = datasets_dir

    async def list_datasets(self) -> list[DatasetSummary]:
        dataset_files = sorted(self.datasets_dir.glob("*.json"))
        datasets: list[DatasetSummary] = []

        for dataset_file in dataset_files:
            dataset = await self._load_dataset_file(dataset_file)
            datasets.append(
                DatasetSummary(
                    dataset_id=dataset.dataset_id,
                    name=dataset.name,
                    description=dataset.description,
                    total_tasks=len(dataset.tasks),
                )
            )

        return datasets

    async def get_dataset_tasks(self, dataset_id: str) -> list[BenchmarkTask]:
        dataset = await self._load_dataset_by_id(dataset_id)
        return dataset.tasks

    async def get_dataset(self, dataset_id: str) -> BenchmarkDataset:
        return await self._load_dataset_by_id(dataset_id)

    async def get_task(self, dataset_id: str, task_id: str) -> BenchmarkTask:
        dataset = await self._load_dataset_by_id(dataset_id)

        for task in dataset.tasks:
            if task.task_id == task_id:
                return task

        raise TaskNotFoundError(
            f"Task '{task_id}' was not found in dataset '{dataset_id}'."
        )

    async def _load_dataset_by_id(self, dataset_id: str) -> BenchmarkDataset:
        dataset_file = self.datasets_dir / f"{dataset_id}.json"
        if not dataset_file.exists():
            raise DatasetNotFoundError(f"Dataset '{dataset_id}' was not found.")

        return await self._load_dataset_file(dataset_file)

    async def _load_dataset_file(self, dataset_file: Path) -> BenchmarkDataset:
        try:
            async with aiofiles.open(dataset_file, "r", encoding="utf-8") as file:
                content = await file.read()
            payload = json.loads(content)
            return BenchmarkDataset.model_validate(payload)
        except FileNotFoundError as exc:
            raise DatasetNotFoundError(
                f"Dataset file '{dataset_file.name}' was not found."
            ) from exc
        except json.JSONDecodeError as exc:
            raise DatasetValidationError(
                f"Dataset file '{dataset_file.name}' contains invalid JSON."
            ) from exc
        except ValidationError as exc:
            raise DatasetValidationError(
                f"Dataset file '{dataset_file.name}' failed validation."
            ) from exc


dataset_service = DatasetService()
