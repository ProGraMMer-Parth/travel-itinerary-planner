from typing import Any
from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_user
from app.schemas.trip import (
    TripCreateRequest,
    TripDetailResponse,
    TripFullUpdateRequest,
    TripSummaryResponse,
    TripUpdateRequest,
)
from app.services.trip_service import trip_service

router = APIRouter(prefix="/api/trips", tags=["trips"])


@router.post(
    "",
    response_model=TripDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a generated trip itinerary",
)
async def create_trip(
    payload: TripCreateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> TripDetailResponse:
    return await trip_service.create_trip(user_id=current_user["id"], payload=payload)


@router.get(
    "",
    response_model=list[TripSummaryResponse],
    summary="List all trips for the authenticated user",
)
async def list_trips(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[TripSummaryResponse]:
    return await trip_service.list_trips(user_id=current_user["id"])


@router.get(
    "/{trip_id}",
    response_model=TripDetailResponse,
    summary="Retrieve trip details and itinerary by ID",
)
async def get_trip(
    trip_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> TripDetailResponse:
    return await trip_service.get_trip(user_id=current_user["id"], trip_id=trip_id)


@router.put(
    "/{trip_id}",
    response_model=TripDetailResponse,
    summary="Update full trip details and itinerary",
)
async def update_trip_full(
    trip_id: str,
    payload: TripFullUpdateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> TripDetailResponse:
    return await trip_service.update_trip_full(
        user_id=current_user["id"], trip_id=trip_id, payload=payload
    )


@router.patch(
    "/{trip_id}",
    response_model=TripSummaryResponse,
    summary="Rename a trip",
)
async def update_trip(
    trip_id: str,
    payload: TripUpdateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> TripSummaryResponse:
    return await trip_service.update_trip(
        user_id=current_user["id"], trip_id=trip_id, payload=payload
    )


@router.delete(
    "/{trip_id}",
    summary="Delete a trip",
)
async def delete_trip(
    trip_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    return await trip_service.delete_trip(user_id=current_user["id"], trip_id=trip_id)
