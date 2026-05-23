import httpx

from app.core.growth_config import settings
from app.core.logging import get_logger
from app.schemas.leads import Lead

PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = (
    "places.id,places.displayName,places.formattedAddress,"
    "places.nationalPhoneNumber,places.internationalPhoneNumber,"
    "places.websiteUri,places.rating,places.userRatingCount"
)


class GooglePlacesError(RuntimeError):
    pass


class GooglePlacesClient:
    def __init__(self, api_key: str | None = None, timeout: float = 15.0) -> None:
        self.api_key = api_key or settings.google_places_api_key
        self.timeout = timeout
        self.logger = get_logger("service.google_places")

    async def search_text(
        self, business_type: str, location: str, max_results: int = 10
    ) -> list[Lead]:
        if not self.api_key:
            raise GooglePlacesError(
                "GOOGLE_PLACES_API_KEY is not configured"
            )

        query = f"{business_type} in {location}"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": FIELD_MASK,
        }
        body = {"textQuery": query, "pageSize": max_results}

        self.logger.info(
            "places search query=%r max_results=%d", query, max_results
        )

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                PLACES_TEXT_SEARCH_URL, headers=headers, json=body
            )

        if response.status_code != 200:
            self.logger.error(
                "places error status=%d body=%s", response.status_code, response.text
            )
            raise GooglePlacesError(
                f"Google Places API returned {response.status_code}: {response.text}"
            )

        data = response.json()
        places = data.get("places", []) or []
        leads = [self._to_lead(p) for p in places[:max_results]]
        self.logger.info("places search returned count=%d", len(leads))
        return leads

    @staticmethod
    def _to_lead(place: dict) -> Lead:
        display_name = place.get("displayName") or {}
        name = display_name.get("text") if isinstance(display_name, dict) else None
        return Lead(
            name=name or "Unknown",
            address=place.get("formattedAddress"),
            phone=place.get("nationalPhoneNumber")
            or place.get("internationalPhoneNumber"),
            website=place.get("websiteUri"),
            rating=place.get("rating"),
            review_count=place.get("userRatingCount"),
            place_id=place.get("id") or "",
        )
