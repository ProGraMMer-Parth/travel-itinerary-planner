from datetime import datetime, timezone
import logging
from typing import Any, Optional
import httpx
from fastapi import HTTPException, status
import json

from app.config import settings
from app.schemas.itinerary import ItineraryGenerateResponse
from app.schemas.trip import (
    TripCreateRequest,
    TripDetailResponse,
    TripFullUpdateRequest,
    TripSummaryResponse,
    TripUpdateRequest,
)

logger = logging.getLogger(__name__)
BUDGET_AMOUNTS = {
    "budget": 1500,
    "moderate": 3000,
    "premium": 6000,
    "luxury": 12000,
}


def _format_budget(trip: dict[str, Any], fallback: Optional[str] = None) -> Optional[str]:
    if fallback:
        return str(fallback)
    prefs = trip.get("preferences")
    if isinstance(prefs, dict) and prefs.get("budget"):
        return str(prefs["budget"])
    b = trip.get("budget")
    return str(b) if b is not None else None


class TripService:
    def __init__(self) -> None:
        pass

    def _get_headers(self) -> dict[str, str]:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Supabase database is not configured.",
            )
        return {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def _get_rest_url(self, table: str) -> str:
        return f"{settings.supabase_url.rstrip('/')}/rest/v1/{table}"

    async def create_trip(
        self, user_id: str, payload: TripCreateRequest
    ) -> TripDetailResponse:
        headers = self._get_headers()
        url = self._get_rest_url("trips")

        title = payload.title.strip() if payload.title and payload.title.strip() else f"Trip to {payload.destination}"
        now_iso = datetime.now(timezone.utc).isoformat()

        itinerary_dict = payload.itinerary.model_dump(mode="json")
        trip_record = {
            "user_id": user_id,
            "title": title,
            "destination": payload.destination,
            "start_date": payload.start_date.isoformat(),
            "end_date": payload.end_date.isoformat(),
            "budget": BUDGET_AMOUNTS.get(payload.budget, 3000),
            "travel_style": payload.pace,
            "preferences": {
                "budget": payload.budget,
                "pace": payload.pace,
                "interests": payload.interests,
                "itinerary": itinerary_dict,
            },
            "status": "planned",
            "created_at": now_iso,
            "updated_at": now_iso,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, headers=headers, json=trip_record)
                if res.status_code not in (200, 201):
                    logger.error("Failed to insert trip: %s", res.text)
                    err_msg = "Failed to save trip to database."
                    try:
                        err_json = res.json()
                        if "message" in err_json:
                            err_msg = f"Database error: {err_json['message']}"
                    except Exception:
                        pass
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=err_msg,
                    )
                saved_trips = res.json()
                saved_trip = saved_trips[0] if isinstance(saved_trips, list) else saved_trips

                # Also persist into public.itineraries table if available
                itinerary_url = self._get_rest_url("itineraries")
                itinerary_record = {
                    "trip_id": saved_trip["id"],
                    "user_id": user_id,
                    "itinerary_data": itinerary_dict,
                    "created_at": now_iso,
                    "updated_at": now_iso,
                }
                itin_res = await client.post(itinerary_url, headers=headers, json=itinerary_record)
                if itin_res.status_code not in (200, 201):
                    logger.warning(
                        "Could not insert into itineraries table (preferences fallback is preserved): %s",
                        itin_res.text,
                    )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service connection error.",
            ) from exc

        return TripDetailResponse(
            id=saved_trip["id"],
            user_id=saved_trip["user_id"],
            title=saved_trip["title"],
            destination=saved_trip["destination"],
            start_date=saved_trip["start_date"],
            end_date=saved_trip["end_date"],
            budget=_format_budget(saved_trip, fallback=payload.budget),
            travel_style=saved_trip.get("travel_style"),
            status=saved_trip.get("status", "planned"),
            created_at=str(saved_trip.get("created_at")),
            updated_at=str(saved_trip.get("updated_at")),
            preferences=saved_trip.get("preferences") or {},
            itinerary=payload.itinerary,
        )

    async def list_trips(self, user_id: str) -> list[TripSummaryResponse]:
        headers = self._get_headers()
        url = f"{self._get_rest_url('trips')}?user_id=eq.{user_id}&order=created_at.desc"

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code != 200:
                    logger.error("Failed to list trips: %s", res.text)
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to retrieve trips.",
                    )
                trips_data = res.json()
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service connection error.",
            ) from exc

        results: list[TripSummaryResponse] = []
        for trip in trips_data:
            results.append(
                TripSummaryResponse(
                    id=trip["id"],
                    user_id=trip["user_id"],
                    title=trip["title"],
                    destination=trip["destination"],
                    start_date=trip["start_date"],
                    end_date=trip["end_date"],
                    budget=_format_budget(trip),
                    travel_style=trip.get("travel_style"),
                    status=trip.get("status", "planned"),
                    created_at=str(trip.get("created_at")),
                    updated_at=str(trip.get("updated_at")),
                )
            )
        return results

    async def get_trip(self, user_id: str, trip_id: str) -> TripDetailResponse:
        headers = self._get_headers()
        url = f"{self._get_rest_url('trips')}?id=eq.{trip_id}&user_id=eq.{user_id}&limit=1"

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to retrieve trip.",
                    )
                trips = res.json()
                if not trips:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Trip not found.",
                    )
                trip = trips[0]

                # Look up itinerary from itineraries table first, fallback to preferences
                itinerary_data: Optional[dict[str, Any]] = None
                itin_url = f"{self._get_rest_url('itineraries')}?trip_id=eq.{trip_id}&user_id=eq.{user_id}&limit=1"
                itin_res = await client.get(itin_url, headers=headers)
                if itin_res.status_code == 200:
                    itin_records = itin_res.json()
                    if itin_records and isinstance(itin_records, list):
                        itinerary_data = itin_records[0].get("itinerary_data")

                if not itinerary_data and isinstance(trip.get("preferences"), dict):
                    itinerary_data = trip["preferences"].get("itinerary")

        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service connection error.",
            ) from exc

        parsed_itinerary: Optional[ItineraryGenerateResponse] = None
        if itinerary_data:
            try:
                parsed_itinerary = ItineraryGenerateResponse.model_validate(itinerary_data)
            except Exception as e:
                logger.warning("Could not parse stored itinerary: %s", e)

        return TripDetailResponse(
            id=trip["id"],
            user_id=trip["user_id"],
            title=trip["title"],
            destination=trip["destination"],
            start_date=trip["start_date"],
            end_date=trip["end_date"],
            budget=_format_budget(trip),
            travel_style=trip.get("travel_style"),
            status=trip.get("status", "planned"),
            created_at=str(trip.get("created_at")),
            updated_at=str(trip.get("updated_at")),
            preferences=trip.get("preferences") or {},
            itinerary=parsed_itinerary,
        )

    async def update_trip(
        self, user_id: str, trip_id: str, payload: TripUpdateRequest
    ) -> TripSummaryResponse:
        headers = self._get_headers()
        url = f"{self._get_rest_url('trips')}?id=eq.{trip_id}&user_id=eq.{user_id}"

        now_iso = datetime.now(timezone.utc).isoformat()
        update_data = {
            "title": payload.title.strip(),
            "updated_at": now_iso,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.patch(url, headers=headers, json=update_data)
                if res.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to update trip.",
                    )
                trips = res.json()
                if not trips:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Trip not found.",
                    )
                trip = trips[0]
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service connection error.",
            ) from exc

        return TripSummaryResponse(
            id=trip["id"],
            user_id=trip["user_id"],
            title=trip["title"],
            destination=trip["destination"],
            start_date=trip["start_date"],
            end_date=trip["end_date"],
            budget=_format_budget(trip),
            travel_style=trip.get("travel_style"),
            status=trip.get("status", "planned"),
            created_at=str(trip.get("created_at")),
            updated_at=str(trip.get("updated_at")),
        )

    async def update_trip_full(
        self, user_id: str, trip_id: str, payload: TripFullUpdateRequest
    ) -> TripDetailResponse:
        headers = self._get_headers()
        url = f"{self._get_rest_url('trips')}?id=eq.{trip_id}&user_id=eq.{user_id}"

        now_iso = datetime.now(timezone.utc).isoformat()
        itinerary_dict = payload.itinerary.model_dump(mode="json")

        if payload.title and payload.title.strip():
            title = payload.title.strip()
            if title.lower().startswith("trip to "):
                title = f"Trip to {payload.destination}"
        else:
            title = f"Trip to {payload.destination}"

        update_data = {
            "title": title,
            "destination": payload.destination,
            "start_date": payload.start_date.isoformat(),
            "end_date": payload.end_date.isoformat(),
            "budget": BUDGET_AMOUNTS.get(payload.budget, 3000),
            "travel_style": payload.pace,
            "preferences": {
                "budget": payload.budget,
                "pace": payload.pace,
                "interests": payload.interests,
                "itinerary": itinerary_dict,
            },
            "updated_at": now_iso,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.patch(url, headers=headers, json=update_data)
                if res.status_code != 200:
                    logger.error("Failed to update trip record: %s", res.text)
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to update trip.",
                    )
                trips = res.json()
                if not trips:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Trip not found.",
                    )
                trip = trips[0]

                # Update or insert public.itineraries table
                itin_url = f"{self._get_rest_url('itineraries')}?trip_id=eq.{trip_id}&user_id=eq.{user_id}"
                itin_patch_res = await client.patch(
                    itin_url,
                    headers=headers,
                    json={
                        "itinerary_data": itinerary_dict,
                        "updated_at": now_iso,
                    },
                )
                if itin_patch_res.status_code in (200, 204):
                    itin_records = itin_patch_res.json() if itin_patch_res.status_code == 200 else []
                    if not itin_records:
                        itin_insert_url = self._get_rest_url("itineraries")
                        await client.post(
                            itin_insert_url,
                            headers=headers,
                            json={
                                "trip_id": trip_id,
                                "user_id": user_id,
                                "itinerary_data": itinerary_dict,
                                "created_at": now_iso,
                                "updated_at": now_iso,
                            },
                        )
                else:
                    logger.warning(
                        "Could not patch itineraries table (fallback preferences is preserved): %s",
                        itin_patch_res.text,
                    )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service connection error.",
            ) from exc

        return TripDetailResponse(
            id=trip["id"],
            user_id=trip["user_id"],
            title=trip["title"],
            destination=trip["destination"],
            start_date=trip["start_date"],
            end_date=trip["end_date"],
            budget=_format_budget(trip, fallback=payload.budget),
            travel_style=trip.get("travel_style"),
            status=trip.get("status", "planned"),
            created_at=str(trip.get("created_at")),
            updated_at=str(trip.get("updated_at")),
            preferences=trip.get("preferences") or {},
            itinerary=payload.itinerary,
        )

    async def delete_trip(self, user_id: str, trip_id: str) -> dict[str, Any]:
        headers = self._get_headers()
        url = f"{self._get_rest_url('trips')}?id=eq.{trip_id}&user_id=eq.{user_id}"

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.delete(url, headers=headers)
                if res.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to delete trip.",
                    )
                deleted = res.json()
                if not deleted:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Trip not found.",
                    )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service connection error.",
            ) from exc

        return {"message": "Trip deleted successfully", "id": trip_id}


trip_service = TripService()
