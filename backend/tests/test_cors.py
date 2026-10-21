from fastapi.testclient import TestClient

from app.config import REQUIRED_LOCAL_ORIGINS, settings
from app.main import app

client = TestClient(app)


def test_required_local_vite_origins_are_allowed():
    for origin in REQUIRED_LOCAL_ORIGINS:
        assert origin in settings.cors_origin_list


def test_cors_preflight_from_vite_5174():
    response = client.options(
        "/api/itineraries/generate",
        headers={
            "Origin": "http://localhost:5174",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5174"
    allow_methods = response.headers.get("access-control-allow-methods", "")
    assert "POST" in allow_methods.upper()


def test_cors_headers_on_generate_post():
    response = client.post(
        "/api/itineraries/generate",
        headers={"Origin": "http://localhost:5174"},
        json={
            "destination": "Goa",
            "start_date": "2026-11-01",
            "end_date": "2026-11-03",
            "interests": ["Culture"],
            "budget": "moderate",
            "pace": "balanced",
            "demo": True,
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5174"
