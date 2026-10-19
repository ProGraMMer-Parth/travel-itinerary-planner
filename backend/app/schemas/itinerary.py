from pydantic import BaseModel


class ItineraryCreate(BaseModel):
    destination: str
    start_date: str
    end_date: str
