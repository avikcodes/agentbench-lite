from __future__ import annotations

from app.schemas.evaluation import EvaluationProfile, MetricName
from app.evaluators.configs.weights import WEIGHT_PROFILES

EVALUATION_PROFILES: dict[str, EvaluationProfile] = {
    "balanced": EvaluationProfile(
        name="balanced",
        description="Balanced evaluation weighting all metrics equally",
        metric_weights=WEIGHT_PROFILES["balanced"],
    ),
    "latency_focused": EvaluationProfile(
        name="latency_focused",
        description="Prioritizes execution speed and latency metrics",
        metric_weights=WEIGHT_PROFILES["latency_focused"],
    ),
    "accuracy_focused": EvaluationProfile(
        name="accuracy_focused",
        description="Prioritizes correctness and exact match accuracy",
        metric_weights=WEIGHT_PROFILES["accuracy_focused"],
    ),
    "efficiency_focused": EvaluationProfile(
        name="efficiency_focused",
        description="Prioritizes tool usage and reasoning efficiency",
        metric_weights=WEIGHT_PROFILES["efficiency_focused"],
    ),
}


def list_profiles() -> list[EvaluationProfile]:
    return list(EVALUATION_PROFILES.values())


def get_profile(name: str) -> EvaluationProfile:
    profile = EVALUATION_PROFILES.get(name)
    if profile is None:
        raise ValueError(f"Evaluation profile '{name}' was not found.")
    return profile
