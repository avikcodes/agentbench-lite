from __future__ import annotations

import ast

from pydantic import BaseModel

from app.schemas.tool import CalculatorInput, CalculatorOutput
from app.tools.base import BaseTool


class CalculatorTool(BaseTool):
    name = "calculator"
    description = "Safely evaluates basic arithmetic expressions."
    input_model = CalculatorInput
    output_model = CalculatorOutput

    async def execute(self, payload: BaseModel) -> CalculatorOutput:
        tool_input = CalculatorInput.model_validate(payload)
        result = self._evaluate_expression(tool_input.expression)
        return CalculatorOutput(
            result=result,
            expression=tool_input.expression,
        )

    def _evaluate_expression(self, expression: str) -> float:
        try:
            parsed = ast.parse(expression, mode="eval")
        except SyntaxError as exc:
            raise ValueError("Invalid arithmetic expression.") from exc

        result = self._evaluate_node(parsed.body)
        return float(result)

    def _evaluate_node(self, node: ast.AST) -> float | int:
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return node.value

        if isinstance(node, ast.BinOp):
            left = self._evaluate_node(node.left)
            right = self._evaluate_node(node.right)

            if isinstance(node.op, ast.Add):
                return left + right
            if isinstance(node.op, ast.Sub):
                return left - right
            if isinstance(node.op, ast.Mult):
                return left * right
            if isinstance(node.op, ast.Div):
                return left / right
            if isinstance(node.op, ast.FloorDiv):
                return left // right
            if isinstance(node.op, ast.Mod):
                return left % right
            if isinstance(node.op, ast.Pow):
                return left**right

        if isinstance(node, ast.UnaryOp):
            operand = self._evaluate_node(node.operand)

            if isinstance(node.op, ast.UAdd):
                return +operand
            if isinstance(node.op, ast.USub):
                return -operand

        raise ValueError("Expression contains unsupported operations.")
