from __future__ import annotations

from pydantic import BaseModel

from app.schemas.tool import UnitConverterInput, UnitConverterOutput
from app.tools.base import BaseTool


class UnitConverterTool(BaseTool):
    name = "unit_converter"
    description = "Converts simple length and weight units."
    input_model = UnitConverterInput
    output_model = UnitConverterOutput

    _LENGTH_FACTORS = {
        "mm": 0.001,
        "cm": 0.01,
        "m": 1.0,
        "km": 1000.0,
        "in": 0.0254,
        "ft": 0.3048,
        "yd": 0.9144,
        "mi": 1609.344,
    }
    _WEIGHT_FACTORS = {
        "mg": 0.000001,
        "g": 0.001,
        "kg": 1.0,
        "lb": 0.45359237,
        "oz": 0.028349523125,
    }

    async def execute(self, payload: BaseModel) -> UnitConverterOutput:
        tool_input = UnitConverterInput.model_validate(payload)
        from_unit = tool_input.from_unit.lower()
        to_unit = tool_input.to_unit.lower()

        category, factors = self._get_supported_category(from_unit, to_unit)
        base_value = tool_input.value * factors[from_unit]
        converted_value = base_value / factors[to_unit]

        return UnitConverterOutput(
            original_value=tool_input.value,
            original_unit=from_unit,
            converted_value=round(converted_value, 6),
            converted_unit=to_unit,
            category=category,
        )

    def _get_supported_category(
        self,
        from_unit: str,
        to_unit: str,
    ) -> tuple[str, dict[str, float]]:
        if from_unit in self._LENGTH_FACTORS and to_unit in self._LENGTH_FACTORS:
            return "length", self._LENGTH_FACTORS

        if from_unit in self._WEIGHT_FACTORS and to_unit in self._WEIGHT_FACTORS:
            return "weight", self._WEIGHT_FACTORS

        raise ValueError(
            "Unsupported conversion. Use matching length units or matching weight units."
        )
