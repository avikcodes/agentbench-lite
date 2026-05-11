from fastapi import APIRouter, HTTPException, status

from app.schemas.tool import ToolExecutionRequest, ToolExecutionResponse, ToolMetadata
from app.services.tool_service import (
    ToolExecutionError,
    ToolNotFoundError,
    ToolValidationError,
    tool_service,
)

router = APIRouter(prefix="/tools", tags=["tools"])


@router.get("", response_model=list[ToolMetadata])
async def list_tools() -> list[ToolMetadata]:
    return await tool_service.list_tools()


@router.post("/execute", response_model=ToolExecutionResponse)
async def execute_tool(request: ToolExecutionRequest) -> ToolExecutionResponse:
    try:
        return await tool_service.execute_tool(request.tool_name, request.input)
    except ToolNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ToolValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.args[0],
        ) from exc
    except ToolExecutionError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get("/{tool_name}", response_model=ToolMetadata)
async def get_tool(tool_name: str) -> ToolMetadata:
    try:
        return await tool_service.get_tool(tool_name)
    except ToolNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
