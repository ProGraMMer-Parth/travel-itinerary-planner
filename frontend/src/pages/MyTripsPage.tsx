import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { deleteTrip, getTrip, getTrips, updateTripTitle } from "../services/api";
import type { TripDetail, TripSummary } from "../types";

type MyTripsPageProps = {
  onOpenTrip: (tripDetail: TripDetail) => void;
  onPlanNewTrip: () => void;
  onSignInRequired: () => void;
  refreshKey?: number;
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const parsed = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? dateStr
    : parsed.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

export default function MyTripsPage({
  onOpenTrip,
  onPlanNewTrip,
  onSignInRequired,
  refreshKey,
}: MyTripsPageProps) {
  const { user, loading: authLoading, getValidToken } = useAuth();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track user ID and refresh key to avoid unnecessary refetches on tab switch while refetching on updates
  const loadedUserIdRef = useRef<string | null>(null);
  const lastRefreshKeyRef = useRef<number | undefined>(refreshKey);

  // Rename modal / inline state
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [savingRename, setSavingRename] = useState(false);

  // Delete confirmation state
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Opening trip loading state
  const [openingTripId, setOpeningTripId] = useState<string | null>(null);

  const fetchTrips = useCallback(
    async (showLoadingSpinner = true) => {
      const activeToken = await getValidToken();
      if (!activeToken) {
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (showLoadingSpinner) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const fetched = await getTrips(activeToken);
        setTrips(fetched);
        if (user?.id) {
          loadedUserIdRef.current = user.id;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load your trips.");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [getValidToken, user?.id]
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      setTrips([]);
      loadedUserIdRef.current = null;
      return;
    }

    if (loadedUserIdRef.current !== user.id || lastRefreshKeyRef.current !== refreshKey) {
      lastRefreshKeyRef.current = refreshKey;
      fetchTrips(true);
    }
  }, [user, authLoading, refreshKey, fetchTrips]);

  async function handleOpen(tripId: string) {
    const activeToken = await getValidToken();
    if (!activeToken) return;

    setOpeningTripId(tripId);
    setError(null);
    try {
      const detail = await getTrip(activeToken, tripId);
      onOpenTrip(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open trip itinerary.");
    } finally {
      setOpeningTripId(null);
    }
  }

  function startRename(trip: TripSummary) {
    setEditingTripId(trip.id);
    setEditingTitle(trip.title);
  }

  async function handleSaveRename(tripId: string) {
    const activeToken = await getValidToken();
    if (!activeToken || !editingTitle.trim()) return;

    setSavingRename(true);
    try {
      const updated = await updateTripTitle(activeToken, tripId, editingTitle.trim());
      setTrips((prev) =>
        prev.map((t) => (t.id === tripId ? { ...t, title: updated.title } : t))
      );
      setEditingTripId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update trip title.");
    } finally {
      setSavingRename(false);
    }
  }

  async function handleConfirmDelete(tripId: string) {
    const activeToken = await getValidToken();
    if (!activeToken) return;

    setDeletingLoading(true);
    try {
      await deleteTrip(activeToken, tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      setDeletingTripId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete trip.");
    } finally {
      setDeletingLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="planner-page">
        <div className="planner-page-inner text-center">
          <p className="loading-state">Checking your session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="planner-page">
        <div className="planner-page-inner">
          <div className="planner-page-heading">
            <span className="section-kicker">MY SAVED TRIPS</span>
            <h1>Sign in to view your trips</h1>
            <p>
              Your saved itineraries and upcoming adventures are kept secure in your account.
            </p>
          </div>

          <div className="trip-form text-center empty-state-box">
            <div className="empty-state-icon" aria-hidden="true">
              🧳
            </div>
            <h2>Access your saved travel plans</h2>
            <p>
              Sign in to your Trip Genius AI account to browse, edit, and organize all your saved itineraries.
            </p>
            <div className="planner-form-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={onSignInRequired}
              >
                Sign In to View Trips <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="planner-page">
      <div className="planner-page-inner">
        <div className="planner-page-heading">
          <div className="heading-row">
            <div>
              <span className="section-kicker">PERSONAL COLLECTION</span>
              <h1>My Trips</h1>
              <p>
                {trips.length === 1
                  ? "You have 1 saved journey."
                  : `You have ${trips.length} saved journeys.`}
              </p>
            </div>
            <div className="heading-actions">
              <button
                type="button"
                className="button button-secondary button-small"
                onClick={() => fetchTrips(false)}
                disabled={loading || isRefreshing}
                title="Refresh trip list"
              >
                {isRefreshing ? "Refreshing..." : "↻ Refresh"}
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={onPlanNewTrip}
              >
                + Plan New Trip
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="trip-form text-center">
            <p className="loading-state">Loading your saved journeys...</p>
          </div>
        ) : error ? (
          <div className="trip-form text-center empty-state-box">
            <div className="auth-alert auth-alert-error" role="alert">
              {error}
            </div>
            <h2>Could not load trips</h2>
            <p>We encountered an issue fetching your saved trips. Please try again.</p>
            <div className="planner-form-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={() => fetchTrips(true)}
              >
                ↻ Try Again
              </button>
            </div>
          </div>
        ) : trips.length === 0 ? (
          <div className="trip-form text-center empty-state-box">
            <div className="empty-state-icon" aria-hidden="true">
              🗺️
            </div>
            <h2>No trips saved yet</h2>
            <p>
              When you generate an itinerary you love, click &quot;Save Trip&quot; to keep it handy right here.
            </p>
            <div className="planner-form-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={onPlanNewTrip}
              >
                Start planning a trip <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="trips-grid">
            {trips.map((trip) => {
              const isEditing = editingTripId === trip.id;
              const isDeleting = deletingTripId === trip.id;
              const isOpening = openingTripId === trip.id;

              return (
                <div key={trip.id} className="trip-card">
                  <div className="trip-card-header">
                    {isEditing ? (
                      <div className="rename-form">
                        <input
                          type="text"
                          className="form-input rename-input"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          disabled={savingRename}
                          autoFocus
                        />
                        <div className="rename-actions">
                          <button
                            type="button"
                            className="button button-small button-primary"
                            onClick={() => handleSaveRename(trip.id)}
                            disabled={savingRename || !editingTitle.trim()}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="button button-small button-secondary"
                            onClick={() => setEditingTripId(null)}
                            disabled={savingRename}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="trip-card-title-row">
                        <h3 className="trip-card-title">{trip.title}</h3>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => startRename(trip)}
                          title="Rename trip"
                          aria-label={`Rename ${trip.title}`}
                        >
                          ✎
                        </button>
                      </div>
                    )}
                    <span className="destination-badge">{trip.destination}</span>
                  </div>

                  <div className="trip-card-body">
                    <div className="trip-card-meta">
                      <div className="meta-item">
                        <span className="meta-label">Dates</span>
                        <span className="meta-val">
                          {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
                        </span>
                      </div>
                      {trip.travel_style && (
                        <div className="meta-item">
                          <span className="meta-label">Pace</span>
                          <span className="meta-val capitalize">{trip.travel_style}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isDeleting ? (
                    <div className="delete-confirm-box">
                      <p>Delete this trip? This cannot be undone.</p>
                      <div className="confirm-actions">
                        <button
                          type="button"
                          className="button button-small button-danger"
                          onClick={() => handleConfirmDelete(trip.id)}
                          disabled={deletingLoading}
                        >
                          {deletingLoading ? "Deleting..." : "Yes, Delete"}
                        </button>
                        <button
                          type="button"
                          className="button button-small button-secondary"
                          onClick={() => setDeletingTripId(null)}
                          disabled={deletingLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="trip-card-footer">
                      <button
                        type="button"
                        className="button button-primary trip-action-btn"
                        onClick={() => handleOpen(trip.id)}
                        disabled={isOpening}
                      >
                        {isOpening ? "Opening..." : "View Itinerary →"}
                      </button>
                      <button
                        type="button"
                        className="button button-secondary button-danger-subtle"
                        onClick={() => setDeletingTripId(trip.id)}
                        title="Delete trip"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
