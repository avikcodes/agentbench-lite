from __future__ import annotations

import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"


def load_env_file(env_file: Path = ENV_FILE) -> None:
    if not env_file.exists():
        return

    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key and key not in os.environ:
            os.environ[key] = value


class LLMSettings:
    def __init__(self) -> None:
        load_env_file()

        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        self.groq_base_url = os.getenv(
            "GROQ_BASE_URL",
            "https://api.groq.com/openai/v1",
        )
        self.groq_timeout = float(os.getenv("GROQ_TIMEOUT_SECONDS", "30"))
        self.groq_models = self._parse_csv(
            os.getenv(
                "GROQ_MODELS",
                "llama-3.1-8b-instant,llama-3.3-70b-versatile",
            )
        )

        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.openrouter_base_url = os.getenv(
            "OPENROUTER_BASE_URL",
            "https://openrouter.ai/api/v1",
        )
        self.openrouter_timeout = float(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "30"))
        self.openrouter_models = self._parse_csv(
            os.getenv(
                "OPENROUTER_MODELS",
                "openai/gpt-4o-mini,meta-llama/llama-3.1-8b-instruct",
            )
        )
        self.openrouter_site_url = os.getenv("OPENROUTER_SITE_URL", "")
        self.openrouter_app_name = os.getenv("OPENROUTER_APP_NAME", "AgentBench Lite")

    @staticmethod
    def _parse_csv(raw_value: str) -> list[str]:
        return [item.strip() for item in raw_value.split(",") if item.strip()]


settings = LLMSettings()
