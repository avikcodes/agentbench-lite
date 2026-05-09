from typing import Literal

from pydantic import BaseModel, Field


DifficultyLevel = Literal["easy", "medium", "hard"]


class BenchmarkTask(BaseModel):
    task_id: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)
    expected_answer: str = Field(..., min_length=1)
    allowed_tools: list[str] = Field(default_factory=list)
    difficulty: DifficultyLevel


class BenchmarkDataset(BaseModel):
    dataset_id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    tasks: list[BenchmarkTask] = Field(default_factory=list)


class DatasetSummary(BaseModel):
    dataset_id: str
    name: str
    description: str
    total_tasks: int
