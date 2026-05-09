from fastapi import FastAPI

from app.api.router import api_router


def create_application() -> FastAPI:
    app = FastAPI(
        title="AgentBench Lite API",
        version="0.1.0",
    )
    app.include_router(api_router)
    return app


app = create_application()
