import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { createTrip, updateTrip } from "../services/api";
import { exportItineraryToPdf } from "../utils/pdfExport";
import type {
  Budget,
  ItineraryGenerateResponse,
  Pace,
  TripDetail,
} from "../types";

type ItineraryPageProps = {
  destination: string;
  itinerary: ItineraryGenerateResponse | null;
  savedTripId?: string;
  savedTripTitle?: string;
  isSaved?: boolean;
  onSaveSuccess?: (updatedTrip: TripDetail) => void;
  onBack: () => void;
  onEditPreferences?: () => void;
  onViewMyTrips?: () => void;
  onSignInRequired?: () => void;
};

const budgetLabels: Record<Budget, string> = {
  budget: "Budget-friendly",
  moderate: "Moderate",
  premium: "Premium",
  luxury: "Luxury",
};

const paceLabels: Record<Pace, string> = {
  relaxed: "Relaxed",
  balanced: "Balanced",
  packed: "See as much as possible",
};

function formatDate(dateStr: string): string {
  const parsed = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? dateStr
    : parsed.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

export default function ItineraryPage({
  destination,
  itinerary,
  savedTripId,
  savedTripTitle,
  isSaved = false,
  onSaveSuccess,
  onBack,
  onEditPreferences,
  onViewMyTrips,
  onSignInRequired,
}: ItineraryPageProps) {
  const { user, getValidToken } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [localIsSaved, setLocalIsSaved] = useState(Boolean(isSaved));
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    setLocalIsSaved(Boolean(isSaved));
    setSaveError(null);
    setSaveSuccessMessage(null);
    setPdfError(null);
  }, [isSaved, itinerary]);

  const currentDestination = itinerary?.destination || destination;

  async function handleSaveTrip() {
    if (!itinerary) return;

    if (!user) {
      onSignInRequired?.();
      return;
    }

    if (isSaving || localIsSaved) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccessMessage(null);
    setPdfError(null);

    try {
      const activeToken = await getValidToken();
      if (!activeToken) {
        onSignInRequired?.();
        return;
      }

      const payload = {
        title: savedTripTitle,
        destination: itinerary.destination,
        start_date: itinerary.start_date,
        end_date: itinerary.end_date,
        budget: itinerary.budget,
        pace: itinerary.pace,
        interests: itinerary.interests,
        itinerary,
      };

      let savedResult: TripDetail;
      if (savedTripId) {
        savedResult = await updateTrip(activeToken, savedTripId, payload);
        setSaveSuccessMessage("Trip changes successfully saved to My Trips!");
      } else {
        savedResult = await createTrip(activeToken, payload);
        setSaveSuccessMessage("Trip successfully saved to My Trips!");
      }

      setLocalIsSaved(true);
      onSaveSuccess?.(savedResult);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save trip.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDownloadPdf() {
    if (!itinerary) {
      setPdfError("No itinerary is currently available to download.");
      return;
    }

    if (!Array.isArray(itinerary.days) || itinerary.days.length === 0) {
      setPdfError("Itinerary data is incomplete or unavailable to export.");
      return;
    }

    setIsDownloadingPdf(true);
    setPdfError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      await exportItineraryToPdf({
        itinerary,
        tripTitle: savedTripTitle,
        destinationFallback: destination,
      });
    } catch (err) {
      setPdfError(
        err instanceof Error ? err.message : "Failed to generate PDF. Please try again."
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  const handleEdit = onEditPreferences || onBack;

  return (
    <div className="planner-page">
      <div className="planner-page-inner">
        <div className="itinerary-top-nav">
          <button className="back-link" type="button" onClick={onBack}>
            {savedTripId ? "← Back to My Trips" : "← Back to planner"}
          </button>
          <div className="heading-actions">
            <button
              className="button button-secondary button-small"
              type="button"
              onClick={handleEdit}
            >
              ✎ Edit Preferences
            </button>
            {onViewMyTrips && (
              <button
                className="button button-secondary button-small"
                type="button"
                onClick={onViewMyTrips}
              >
                My Trips ↗
              </button>
            )}
          </div>
        </div>

        <div className="planner-page-heading">
          <div className="heading-row">
            <div>
              <span className="section-kicker">
                {savedTripId ? "SAVED ITINERARY" : "YOUR JOURNEY, YOUR WAY"}
              </span>
              <h1>{savedTripTitle ? savedTripTitle : "Your itinerary starts here."}</h1>
              <p>
                {currentDestination
                  ? `Here is the travel plan for ${currentDestination}.`
                  : "Here is what we received for your trip."}
              </p>
            </div>

            {itinerary && (
              <div className="heading-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                >
                  {isDownloadingPdf ? "Preparing PDF..." : "Download PDF"}
                </button>
                <button
                  type="button"
                  className={`button ${localIsSaved ? "button-secondary" : "button-primary"}`}
                  onClick={handleSaveTrip}
                  disabled={isSaving || localIsSaved}
                >
                  {isSaving ? (
                    "Saving trip..."
                  ) : localIsSaved ? (
                    "✓ Saved to My Trips"
                  ) : savedTripId ? (
                    "💾 Save Changes"
                  ) : (
                    "💾 Save Trip"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {saveSuccessMessage && (
          <div className="auth-alert auth-alert-success" role="status">
            <span>{saveSuccessMessage}</span>
            {onViewMyTrips && (
              <button
                type="button"
                className="alert-link-btn"
                onClick={onViewMyTrips}
              >
                View in My Trips →
              </button>
            )}
          </div>
        )}

        {pdfError && (
          <div className="auth-alert auth-alert-error" role="alert">
            <span>{pdfError}</span>
            <button
              type="button"
              className="alert-link-btn"
              onClick={() => setPdfError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {saveError && (
          <div className="auth-alert auth-alert-error" role="alert">
            <span>{saveError}</span>
            <button
              type="button"
              className="alert-link-btn"
              onClick={handleSaveTrip}
              disabled={isSaving}
            >
              Retry
            </button>
          </div>
        )}

        {itinerary ? (
          <>
            <p className="demo-notice" role="status">
              {itinerary.notice}
            </p>

            <section className="trip-form">
              <section className="form-section">
                <span className="form-step form-step-star" aria-hidden="true">★</span>
                <div className="form-section-content">
                  <h2>Trip preferences</h2>
                  <p>These details were used to create this itinerary.</p>

                  <ul className="preference-star-list" aria-label="Trip preferences">
                    <li className="preference-star-item">
                      <span className="pref-star-bullet" aria-hidden="true">★</span>
                      <span className="pref-label">Destination:</span>
                      <span className="pref-value">{itinerary.destination}</span>
                    </li>
                    <li className="preference-star-item">
                      <span className="pref-star-bullet" aria-hidden="true">★</span>
                      <span className="pref-label">Travel Dates:</span>
                      <span className="pref-value">
                        {formatDate(itinerary.start_date)} —{" "}
                        {formatDate(itinerary.end_date)}
                      </span>
                    </li>
                    <li className="preference-star-item">
                      <span className="pref-star-bullet" aria-hidden="true">★</span>
                      <span className="pref-label">Budget:</span>
                      <span className="pref-value">{budgetLabels[itinerary.budget]}</span>
                    </li>
                    <li className="preference-star-item">
                      <span className="pref-star-bullet" aria-hidden="true">★</span>
                      <span className="pref-label">Pace:</span>
                      <span className="pref-value">{paceLabels[itinerary.pace]}</span>
                    </li>
                    <li className="preference-star-item">
                      <span className="pref-star-bullet" aria-hidden="true">★</span>
                      <span className="pref-label">Interests:</span>
                      <span className="pref-value">{itinerary.interests.join(", ")}</span>
                    </li>
                  </ul>
                </div>
              </section>

              {itinerary.days.map((day) => (
                <section className="form-section" key={day.day_number}>
                  <span className="form-step">
                    {String(day.day_number).padStart(2, "0")}
                  </span>
                  <div className="form-section-content">
                    <h2>{day.title}</h2>
                    <p>
                      {formatDate(day.date)} — {day.notes}
                    </p>

                    {day.activities.length > 0 ? (
                      <ul className="itinerary-activities">
                        {day.activities.map((activity) => (
                          <li key={activity}>{activity}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No activities yet.</p>
                    )}
                  </div>
                </section>
              ))}

              <div className="planner-form-actions">
                <button
                  className="button button-primary"
                  type="button"
                  onClick={handleEdit}
                >
                  Edit trip preferences <span aria-hidden="true">→</span>
                </button>
                <button
                  type="button"
                  className={`button ${isSaved ? "button-secondary" : "button-secondary"}`}
                  onClick={handleSaveTrip}
                  disabled={isSaving || isSaved}
                >
                  {isSaving ? "Saving..." : isSaved ? "✓ Trip Saved" : "Save this Trip"}
                </button>
              </div>
            </section>
          </>
        ) : (
          <section className="trip-form">
            <h2>No itinerary to show yet</h2>
            <p>
              Return to the planner and create an itinerary to see the response
              from the trip planner service.
            </p>

            <button
              className="button button-primary"
              type="button"
              onClick={handleEdit}
            >
              Edit trip preferences <span aria-hidden="true">→</span>
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
