from fastapi import APIRouter

from app.api.routes.analytics import router as analytics_router
from app.api.routes.benchmarks import router as benchmarks_router
from app.api.routes.evaluations import router as evaluations_router
from app.api.routes.executions import router as executions_router
from app.api.routes.health import router as health_router
from app.api.routes.models import router as models_router
from app.api.routes.root import router as root_router
from app.api.routes.tools import router as tools_router

api_router = APIRouter()
api_router.include_router(root_router)
api_router.include_router(health_router)
api_router.include_router(benchmarks_router)
api_router.include_router(tools_router)
api_router.include_router(models_router)
api_router.include_router(executions_router)
api_router.include_router(evaluations_router)
api_router.include_router(analytics_router)
