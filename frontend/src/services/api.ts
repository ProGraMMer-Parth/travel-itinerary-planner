import type {
  ItineraryGenerateRequest,
  ItineraryGenerateResponse,
  TripCreatePayload,
  TripDetail,
  TripSummary,
} from "../types";
import { getValidSessionToken, refreshSessionToken } from "./supabase";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const DEFAULT_TIMEOUT_MS = 25000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error(
        "Could not connect to the backend service. Please check that the server is running."
      );
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

async function parseErrorMessage(response: Response, defaultMessage: string): Promise<string> {
  try {
    const errorData = await response.json();
    if (typeof errorData?.detail === "string") {
      return errorData.detail;
    }
    if (Array.isArray(errorData?.detail) && errorData.detail.length > 0) {
      const first = errorData.detail[0];
      if (typeof first?.msg === "string") {
        const field = Array.isArray(first?.loc) ? first.loc[first.loc.length - 1] : "";
        if (field && typeof field === "string") {
          const fieldFormatted = field.replace(/_/g, " ");
          return `${fieldFormatted.charAt(0).toUpperCase() + fieldFormatted.slice(1)}: ${first.msg}`;
        }
        return first.msg;
      }
    }
  } catch {
    // ignore json parse error
  }
  return defaultMessage;
}

/**
 * Dispatches an authenticated request to the backend.
 * Obtains a valid session token before sending, and retries at most once
 * after refreshing the session if a 401 Unauthorized response is returned.
 */
async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  providedToken?: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  // 1. Obtain current valid session and access token from Supabase client
  let token = await getValidSessionToken(providedToken);
  if (!token && providedToken) {
    token = providedToken;
  }

  if (!token) {
    throw new Error("Invalid or expired session token. Please sign in again.");
  }

  const makeRequest = (authToken: string) => {
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${authToken}`);
    return fetchWithTimeout(url, { ...options, headers }, timeoutMs);
  };

  let response = await makeRequest(token);

  // 2. If 401 Unauthorized, refresh the session through the supported Supabase SDK flow and retry at most once
  if (response.status === 401) {
    // Check if another concurrent request has already refreshed the token in storage
    let nextToken: string | null = null;
    const latestStoredToken = await getValidSessionToken();
    if (latestStoredToken && latestStoredToken !== token) {
      nextToken = latestStoredToken;
    } else {
      nextToken = await refreshSessionToken();
    }

    if (nextToken && nextToken !== token) {
      // Retry at most once with the newly refreshed token
      response = await makeRequest(nextToken);
    }
  }

  return response;
}

export async function getHealth(): Promise<{ status: string }> {
  const response = await fetchWithTimeout(`${API_URL}/health`, {}, 8000);

  if (!response.ok) {
    throw new Error("Health check failed");
  }

  return response.json() as Promise<{ status: string }>;
}

export async function generateItinerary(
  payload: ItineraryGenerateRequest
): Promise<ItineraryGenerateResponse> {
  const response = await fetchWithTimeout(
    `${API_URL}/api/itineraries/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    45000 // allow up to 45s for LLM generation
  );

  if (!response.ok) {
    const detail = await parseErrorMessage(
      response,
      "Could not generate an itinerary. Please try again."
    );
    throw new Error(detail);
  }

  return response.json() as Promise<ItineraryGenerateResponse>;
}

export async function createTrip(
  token: string,
  payload: TripCreatePayload
): Promise<TripDetail> {
  const response = await fetchWithAuth(
    `${API_URL}/api/trips`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    token,
    20000
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid or expired session token. Please sign in again.");
    }
    const detail = await parseErrorMessage(response, "Failed to save trip.");
    throw new Error(detail);
  }

  return response.json() as Promise<TripDetail>;
}

export async function updateTrip(
  token: string,
  tripId: string,
  payload: TripCreatePayload
): Promise<TripDetail> {
  const response = await fetchWithAuth(
    `${API_URL}/api/trips/${tripId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    token,
    20000
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid or expired session token. Please sign in again.");
    }
    const detail = await parseErrorMessage(response, "Failed to update trip.");
    throw new Error(detail);
  }

  return response.json() as Promise<TripDetail>;
}

export async function getTrips(token: string): Promise<TripSummary[]> {
  const response = await fetchWithAuth(
    `${API_URL}/api/trips`,
    {
      method: "GET",
    },
    token,
    15000
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid or expired session token. Please sign in again.");
    }
    const detail = await parseErrorMessage(response, "Failed to load trips.");
    throw new Error(detail);
  }

  return response.json() as Promise<TripSummary[]>;
}

export async function getTrip(token: string, tripId: string): Promise<TripDetail> {
  const response = await fetchWithAuth(
    `${API_URL}/api/trips/${tripId}`,
    {
      method: "GET",
    },
    token,
    15000
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid or expired session token. Please sign in again.");
    }
    const detail = await parseErrorMessage(response, "Failed to load trip details.");
    throw new Error(detail);
  }

  return response.json() as Promise<TripDetail>;
}

export async function updateTripTitle(
  token: string,
  tripId: string,
  title: string
): Promise<TripSummary> {
  const response = await fetchWithAuth(
    `${API_URL}/api/trips/${tripId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    },
    token,
    15000
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid or expired session token. Please sign in again.");
    }
    const detail = await parseErrorMessage(response, "Failed to rename trip.");
    throw new Error(detail);
  }

  return response.json() as Promise<TripSummary>;
}

export async function deleteTrip(
  token: string,
  tripId: string
): Promise<{ message: string; id: string }> {
  const response = await fetchWithAuth(
    `${API_URL}/api/trips/${tripId}`,
    {
      method: "DELETE",
    },
    token,
    15000
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid or expired session token. Please sign in again.");
    }
    const detail = await parseErrorMessage(response, "Failed to delete trip.");
    throw new Error(detail);
  }

  return response.json() as Promise<{ message: string; id: string }>;
}
