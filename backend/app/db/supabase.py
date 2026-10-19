from app.config import settings


def get_supabase_config() -> dict[str, str]:
    return {
        "url": settings.supabase_url,
        "service_role_key": settings.supabase_service_role_key,
    }
