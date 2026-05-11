from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel

from app.schemas.tool import ToolMetadata


class BaseTool(ABC):
    name: str
    description: str
    input_model: type[BaseModel]
    output_model: type[BaseModel]

    def get_metadata(self) -> ToolMetadata:
        return ToolMetadata(
            name=self.name,
            description=self.description,
            input_schema=self.input_model.model_json_schema(),
            output_schema=self.output_model.model_json_schema(),
        )

    def validate_input(self, payload: dict[str, Any]) -> BaseModel:
        return self.input_model.model_validate(payload)

    @abstractmethod
    async def execute(self, payload: BaseModel) -> BaseModel:
        raise NotImplementedError
