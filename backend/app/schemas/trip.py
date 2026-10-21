from datetime import date, datetime
from typing import Any, Optional
from pydantic import BaseModel, Field

from app.schemas.itinerary import Budget, ItineraryGenerateResponse, Pace


class TripCreateRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    destination: str = Field(..., min_length=1, max_length=120)
    start_date: date
    end_date: date
    budget: Budget = "moderate"
    pace: Pace = "balanced"
    interests: list[str] = Field(default_factory=list)
    itinerary: ItineraryGenerateResponse


class TripUpdateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class TripFullUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    destination: str = Field(..., min_length=1, max_length=120)
    start_date: date
    end_date: date
    budget: Budget = "moderate"
    pace: Pace = "balanced"
    interests: list[str] = Field(default_factory=list)
    itinerary: ItineraryGenerateResponse


class TripSummaryResponse(BaseModel):
    id: str
    user_id: str
    title: str
    destination: str
    start_date: date
    end_date: date
    budget: Optional[str] = None
    travel_style: Optional[str] = None
    status: str = "planned"
    created_at: str
    updated_at: Optional[str] = None


class TripDetailResponse(TripSummaryResponse):
    preferences: dict[str, Any] = Field(default_factory=dict)
    itinerary: Optional[ItineraryGenerateResponse] = None
