from app.tools.implementations.calculator import CalculatorTool
from app.tools.implementations.fake_web_search import FakeWebSearchTool
from app.tools.implementations.unit_converter import UnitConverterTool
from app.tools.registry import ToolRegistry


def create_tool_registry() -> ToolRegistry:
    registry = ToolRegistry()
    registry.register(CalculatorTool())
    registry.register(UnitConverterTool())
    registry.register(FakeWebSearchTool())
    return registry


tool_registry = create_tool_registry()
