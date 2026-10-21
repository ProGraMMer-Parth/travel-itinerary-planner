from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

REQUIRED_LOCAL_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    supabase_url: str = ""
    supabase_service_role_key: str = ""
    cors_origins: str = ",".join(REQUIRED_LOCAL_ORIGINS)
    openai_api_key: str = ""
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    groq_timeout_seconds: float = 30.0

    @property
    def cors_origin_list(self) -> list[str]:
        configured = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        merged: list[str] = []
        for origin in [*configured, *REQUIRED_LOCAL_ORIGINS]:
            if origin and origin not in merged:
                merged.append(origin)
        return merged


settings = Settings()
