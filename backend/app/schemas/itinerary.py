from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

Budget = Literal["budget", "moderate", "premium", "luxury"]
Pace = Literal["relaxed", "balanced", "packed"]


class ItineraryCreate(BaseModel):
    destination: str
    start_date: str
    end_date: str


class ItineraryGenerateRequest(BaseModel):
    destination: str = Field(..., min_length=1, max_length=120)
    start_date: date
    end_date: date
    interests: list[str] = Field(default_factory=list)
    budget: Budget = "moderate"
    pace: Pace = "balanced"
    demo: bool = False

    @field_validator("destination")
    @classmethod
    def destination_must_not_be_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Enter a destination.")
        return cleaned

    @field_validator("interests")
    @classmethod
    def interests_must_not_be_empty(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip() for item in value if item.strip()]
        if not cleaned:
            raise ValueError("Choose at least one interest.")
        return cleaned

    @model_validator(mode="after")
    def dates_must_be_in_order(self) -> "ItineraryGenerateRequest":
        if self.end_date < self.start_date:
            raise ValueError("End date must be on or after the start date.")
        if (self.end_date - self.start_date).days + 1 > 30:
            raise ValueError("Trips can be at most 30 days in this demo.")
        return self


class ItineraryDay(BaseModel):
    day_number: int
    date: date
    title: str
    notes: str
    activities: list[str]


class ItineraryGenerateResponse(BaseModel):
    source: Literal["development_demo", "groq"] = "groq"
    notice: str
    destination: str
    start_date: date
    end_date: date
    interests: list[str]
    budget: Budget
    pace: Pace
    day_count: int
    days: list[ItineraryDay]
