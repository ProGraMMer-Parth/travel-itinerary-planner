import json
from unittest.mock import MagicMock, patch

import httpx
from fastapi.testclient import TestClient
from groq import APITimeoutError, RateLimitError

from app.config import settings
from app.main import app

client = TestClient(app)

VALID_PAYLOAD = {
    "destination": "Goa",
    "start_date": "2026-11-01",
    "end_date": "2026-11-03",
    "interests": ["Culture", "Food"],
    "budget": "moderate",
    "pace": "balanced",
}

MOCK_GROQ_RESPONSE = {
    "days": [
        {
            "day_number": 1,
            "title": "Old Goa Heritage & Spice Plantations",
            "notes": "Transport: Local scooter rental (~$6/day). Focus: Portuguese colonial history and coastal cuisine.",
            "activities": [
                "Morning: Basilica of Bom Jesus and Se Cathedral - Explore 16th-century colonial baroque architecture (Free). Transport: 20-min taxi from Panaji (~$8).",
                "Afternoon: Sahakari Spice Farm Tour - Guided plantation tour with an authentic Goan fish curry buffet lunch ($7). Transport: 30-min drive eastward.",
                "Evening: Sunset stroll at Miramar Beach followed by dinner at Viva Panjim - Savor pork vindaloo and bebinca dessert (~$15).",
            ],
        },
        {
            "day_number": 2,
            "title": "North Goa Beaches & Fort Aguada",
            "notes": "Transport: Local bus or auto-rickshaw (~$4). Focus: Coastal views and beach shacks.",
            "activities": [
                "Morning: Visit Fort Aguada & 19th-century lighthouse - Panoramic views of the Arabian Sea (Entry: $1). Food: Coconut water and poi bread.",
                "Afternoon: Relax and swim at Candolim Beach - Try watersports or unwind under umbrella shacks. Food: Goan prawn curry at Fisherman's Cove (~$12).",
                "Evening: Curries and live acoustic music at Anjuna cliffside cafe (~$18). Transport: 25-min auto-rickshaw ride.",
            ],
        },
        {
            "day_number": 3,
            "title": "Fontainhas Latin Quarter & Mandovi River Cruise",
            "notes": "Transport: Walking friendly. Focus: Architecture, art galleries, and local sweets.",
            "activities": [
                "Morning: Walking heritage tour of Fontainhas Latin Quarter - Marvel at colorful Portuguese villas and azulejos tiles (Free).",
                "Afternoon: Confeitaria 31 De Janeiro - Traditional bakery visit for freshly baked pastéis de nata and local snacks (~$5).",
                "Evening: Mandovi River Evening Cruise - Traditional Goan folk dance and music performance ($10). Food: Casual seafood dinner in Panaji (~$16).",
            ],
        },
    ]
}


def test_generate_itinerary_with_groq_success():
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(MOCK_GROQ_RESPONSE)

    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = mock_completion

    with (
        patch("app.services.itinerary_service.settings.groq_api_key", "test-valid-key"),
        patch("app.services.itinerary_service.get_groq_client", return_value=mock_client),
    ):
        response = client.post("/api/itineraries/generate", json=VALID_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "groq"
    assert "Trip Genius AI powered by Groq" in body["notice"]
    assert body["destination"] == "Goa"
    assert body["day_count"] == 3
    assert len(body["days"]) == 3
    assert body["days"][0]["day_number"] == 1
    assert body["days"][0]["date"] == "2026-11-01"
    assert "Old Goa Heritage" in body["days"][0]["title"]
    assert len(body["days"][0]["activities"]) == 3
    assert "Morning:" in body["days"][0]["activities"][0]
    mock_client.chat.completions.create.assert_called_once()
    assert mock_client.chat.completions.create.call_args.kwargs["model"] == settings.groq_model


def test_configured_groq_model_is_used():
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(MOCK_GROQ_RESPONSE)

    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = mock_completion

    custom_model = "openai/gpt-oss-120b"

    with (
        patch("app.services.itinerary_service.settings.groq_api_key", "test-key"),
        patch("app.services.itinerary_service.settings.groq_model", custom_model),
        patch("app.services.itinerary_service.get_groq_client", return_value=mock_client),
    ):
        response = client.post("/api/itineraries/generate", json=VALID_PAYLOAD)

    assert response.status_code == 200
    mock_client.chat.completions.create.assert_called_once()
    assert mock_client.chat.completions.create.call_args.kwargs["model"] == custom_model


def test_generate_itinerary_demo_mode():
    payload = {**VALID_PAYLOAD, "demo": True}
    response = client.post("/api/itineraries/generate", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "development_demo"
    assert "Development demo" in body["notice"]
    assert body["destination"] == "Goa"
    assert body["day_count"] == 3
    assert len(body["days"]) == 3
    assert body["days"][0]["activities"] == []
    assert body["days"][0]["date"] == "2026-11-01"


def test_generate_itinerary_missing_api_key():
    with patch("app.services.itinerary_service.settings.groq_api_key", ""):
        response = client.post("/api/itineraries/generate", json=VALID_PAYLOAD)

    assert response.status_code == 503
    assert "GROQ_API_KEY" in response.json()["detail"]


def test_generate_itinerary_groq_timeout():
    mock_client = MagicMock()
    req = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    mock_client.chat.completions.create.side_effect = APITimeoutError(request=req)

    with (
        patch("app.services.itinerary_service.settings.groq_api_key", "test-key"),
        patch("app.services.itinerary_service.get_groq_client", return_value=mock_client),
    ):
        response = client.post("/api/itineraries/generate", json=VALID_PAYLOAD)

    assert response.status_code == 504
    assert "timed out" in response.json()["detail"].lower()


def test_generate_itinerary_groq_rate_limit():
    mock_client = MagicMock()
    req = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    resp = httpx.Response(429, request=req)
    mock_client.chat.completions.create.side_effect = RateLimitError(
        message="rate limit reached", response=resp, body={}
    )

    with (
        patch("app.services.itinerary_service.settings.groq_api_key", "test-key"),
        patch("app.services.itinerary_service.get_groq_client", return_value=mock_client),
    ):
        response = client.post("/api/itineraries/generate", json=VALID_PAYLOAD)

    assert response.status_code == 429
    assert "rate limit" in response.json()["detail"].lower()


def test_generate_itinerary_groq_invalid_json():
    mock_choice = MagicMock()
    mock_choice.message.content = "Not a JSON document"

    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = mock_completion

    with (
        patch("app.services.itinerary_service.settings.groq_api_key", "test-key"),
        patch("app.services.itinerary_service.get_groq_client", return_value=mock_client),
    ):
        response = client.post("/api/itineraries/generate", json=VALID_PAYLOAD)

    assert response.status_code == 502
    assert "valid json" in response.json()["detail"].lower()


def test_generate_itinerary_groq_missing_activities():
    invalid_data = {
        "days": [
            {"day_number": 1, "title": "Day 1", "notes": "No act", "activities": []},
            {"day_number": 2, "title": "Day 2", "notes": "No act", "activities": []},
            {"day_number": 3, "title": "Day 3", "notes": "No act", "activities": []},
        ]
    }
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(invalid_data)

    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = mock_completion

    with (
        patch("app.services.itinerary_service.settings.groq_api_key", "test-key"),
        patch("app.services.itinerary_service.get_groq_client", return_value=mock_client),
    ):
        response = client.post("/api/itineraries/generate", json=VALID_PAYLOAD)

    assert response.status_code == 502
    assert "contains no activities" in response.json()["detail"]


def test_generate_itinerary_groq_fewer_days_than_requested():
    two_days_data = {
        "days": [
            {"day_number": 1, "title": "Day 1", "notes": "Notes", "activities": ["Morning: Activity 1"]},
            {"day_number": 2, "title": "Day 2", "notes": "Notes", "activities": ["Morning: Activity 2"]},
        ]
    }
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(two_days_data)

    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = mock_completion

    with (
        patch("app.services.itinerary_service.settings.groq_api_key", "test-key"),
        patch("app.services.itinerary_service.get_groq_client", return_value=mock_client),
    ):
        response = client.post("/api/itineraries/generate", json=VALID_PAYLOAD)

    assert response.status_code == 502
    assert "incomplete itinerary" in response.json()["detail"].lower()


def test_generate_itinerary_groq_dict_activities_supported():
    dict_activities_data = {
        "days": [
            {
                "day_number": 1,
                "title": "Day 1",
                "notes": "Overview",
                "activities": [
                    {"time": "Morning", "activity": "Fort visit", "cost": "$5", "transport": "Bus"},
                    {"time": "Afternoon", "activity": "Beach lunch", "food": "Fish curry", "cost": "$12"},
                    {"time": "Evening", "activity": "Sunset cruise", "cost": "$15"},
                ],
            },
            {
                "day_number": 2,
                "title": "Day 2",
                "notes": "Overview",
                "activities": [
                    {"time": "Morning", "activity": "Temple tour", "cost": "Free"},
                    {"time": "Afternoon", "activity": "Spice plantation", "cost": "$10"},
                    {"time": "Evening", "activity": "Latin Quarter dinner", "cost": "$20"},
                ],
            },
            {
                "day_number": 3,
                "title": "Day 3",
                "notes": "Overview",
                "activities": [
                    {"time": "Morning", "activity": "Market walk", "cost": "Free"},
                    {"time": "Afternoon", "activity": "Museum", "cost": "$3"},
                    {"time": "Evening", "activity": "Seafood feast", "cost": "$25"},
                ],
            },
        ]
    }
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(dict_activities_data)

    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = mock_completion

    with (
        patch("app.services.itinerary_service.settings.groq_api_key", "test-key"),
        patch("app.services.itinerary_service.get_groq_client", return_value=mock_client),
    ):
        response = client.post("/api/itineraries/generate", json=VALID_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert len(body["days"]) == 3
    assert "Morning:" in body["days"][0]["activities"][0]
    assert "Cost: $5" in body["days"][0]["activities"][0]
    assert "Food: Fish curry" in body["days"][0]["activities"][1]


def test_generate_itinerary_personalization_in_prompts():
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(MOCK_GROQ_RESPONSE)

    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = mock_completion

    with (
        patch("app.services.itinerary_service.settings.groq_api_key", "test-key"),
        patch("app.services.itinerary_service.get_groq_client", return_value=mock_client),
    ):
        response = client.post("/api/itineraries/generate", json=VALID_PAYLOAD)

    assert response.status_code == 200
    call_args = mock_client.chat.completions.create.call_args.kwargs
    messages = call_args["messages"]
    user_content = messages[1]["content"]

    assert "Goa" in user_content
    assert "2026-11-01" in user_content
    assert "2026-11-03" in user_content
    assert "Culture" in user_content
    assert "Food" in user_content
    assert "moderate" in user_content
    assert "balanced" in user_content


def test_generate_itinerary_rejects_end_before_start():
    payload = {**VALID_PAYLOAD, "start_date": "2026-11-05", "end_date": "2026-11-01"}
    response = client.post("/api/itineraries/generate", json=payload)
    assert response.status_code == 422


def test_generate_itinerary_rejects_empty_interests():
    payload = {**VALID_PAYLOAD, "interests": []}
    response = client.post("/api/itineraries/generate", json=payload)
    assert response.status_code == 422
