from fastapi import APIRouter

router = APIRouter()


@router.get("/", tags=["root"])
async def read_root() -> dict[str, str]:
    return {"message": "AgentBench Lite API is running"}
