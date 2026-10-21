from fastapi import APIRouter

from app.schemas.itinerary import ItineraryGenerateRequest, ItineraryGenerateResponse
from app.services.itinerary_service import generate_itinerary_service

router = APIRouter(prefix="/api/itineraries", tags=["itineraries"])


@router.post("/generate", response_model=ItineraryGenerateResponse)
def generate_itinerary(payload: ItineraryGenerateRequest) -> ItineraryGenerateResponse:
    return generate_itinerary_service(payload)
