import { useEffect, useState } from "react";
import { generateItinerary } from "../services/api";
import type {
  Budget,
  ItineraryGenerateResponse,
  Pace,
  PlannerPreferences,
} from "../types";

type PlannerPageProps = {
  initialDestination?: string;
  initialPreferences?: PlannerPreferences | null;
  onBack: () => void;
  onGenerate: (destination: string, itinerary: ItineraryGenerateResponse) => void;
};

function normalizeInterest(interest: string): string {
  const trimmed = interest.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "slow travel") return "Relaxation";
  if (lower === "nature & adventure" || lower === "nature and adventure") return "Nature";
  if (lower === "culture & heritage" || lower === "culture and heritage") return "Culture";
  return trimmed;
}

export default function PlannerPage({
  initialDestination = "",
  initialPreferences = null,
  onBack,
  onGenerate,
}: PlannerPageProps) {
  const isEditingSavedTrip = Boolean(initialPreferences?.tripId || initialPreferences?.tripTitle);

  const [destination, setDestination] = useState(
    initialPreferences?.destination || initialDestination || ""
  );
  const [startDate, setStartDate] = useState(initialPreferences?.startDate || "");
  const [endDate, setEndDate] = useState(initialPreferences?.endDate || "");
  const [budget, setBudget] = useState<Budget>(initialPreferences?.budget || "moderate");
  const [travelStyle, setTravelStyle] = useState<Pace>(initialPreferences?.pace || "balanced");
  const [interests, setInterests] = useState<string[]>(
    initialPreferences?.interests?.length
      ? initialPreferences.interests.map(normalizeInterest)
      : ["Culture"]
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever initialPreferences or initialDestination changes
  useEffect(() => {
    if (initialPreferences) {
      setDestination(initialPreferences.destination || "");
      setStartDate(initialPreferences.startDate || "");
      setEndDate(initialPreferences.endDate || "");
      setBudget(initialPreferences.budget || "moderate");
      setTravelStyle(initialPreferences.pace || "balanced");
      setInterests(
        initialPreferences.interests?.length
          ? initialPreferences.interests.map(normalizeInterest)
          : ["Culture"]
      );
    } else {
      setDestination(initialDestination || "");
      setStartDate("");
      setEndDate("");
      setBudget("moderate");
      setTravelStyle("balanced");
      setInterests(["Culture"]);
    }
    setError("");
  }, [initialPreferences, initialDestination]);

  const interestOptions = [
    "Nature",
    "Culture",
    "Food",
    "Adventure",
    "Shopping",
    "History",
    "Relaxation",
  ];

  function toggleInterest(interest: string) {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  }

  async function runGeneration(isDemo = false) {
    const trimmedDestination = destination.trim();
    if (!trimmedDestination) {
      setError("Enter a destination to continue.");
      return;
    }

    if (!startDate || !endDate) {
      setError("Choose your start and end dates.");
      return;
    }

    if (endDate < startDate) {
      setError("Your end date needs to be on or after the start date.");
      return;
    }

    if (interests.length === 0) {
      setError("Choose at least one interest.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await generateItinerary({
        destination: trimmedDestination,
        start_date: startDate,
        end_date: endDate,
        interests,
        budget,
        pace: travelStyle,
        demo: isDemo,
      });

      onGenerate(trimmedDestination, response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate an itinerary. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="planner-page">
      <div className="planner-page-inner">
        <button className="back-link" type="button" onClick={onBack}>
          {isEditingSavedTrip ? "← Back to itinerary" : "← Back to home"}
        </button>

        <div className="planner-page-heading">
          <span className="section-kicker">
            {isEditingSavedTrip ? "EDIT TRIP PREFERENCES" : "YOUR JOURNEY STARTS HERE"}
          </span>
          <h1>
            {isEditingSavedTrip
              ? `Refine trip to ${destination || "your destination"}`
              : "Let's plan something wonderful."}
          </h1>
          <p>
            {isEditingSavedTrip
              ? "Update your preferences below and regenerate a personalized itinerary."
              : "Tell us a little about your trip. We'll help you shape a journey around the things you love."}
          </p>
        </div>

        <form
          className="trip-form"
          onSubmit={(event) => {
            event.preventDefault();
            runGeneration(false);
          }}
        >
          <section className="form-section">
            <span className="form-step">01</span>
            <div className="form-section-content">
              <h2>Where are you headed?</h2>
              <p>Choose a destination to start planning.</p>

              <label className="form-field">
                <span>DESTINATION</span>
                <input
                  type="text"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="e.g. Kyoto, Japan"
                  required
                />
              </label>
            </div>
          </section>

          <section className="form-section">
            <span className="form-step">02</span>
            <div className="form-section-content">
              <h2>When would you like to go?</h2>
              <p>Select your travel dates.</p>

              <div className="form-two-columns">
                <label className="form-field">
                  <span>START DATE</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </label>

                <label className="form-field">
                  <span>END DATE</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    min={startDate || new Date().toISOString().split("T")[0]}
                    required
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="form-section">
            <span className="form-step">03</span>
            <div className="form-section-content">
              <h2>What do you love?</h2>
              <p>Choose the experiences you would enjoy most.</p>

              <div className="interest-options">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    className={`interest-chip ${
                      interests.includes(interest) ? "interest-chip-active" : ""
                    }`}
                    aria-pressed={interests.includes(interest)}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interests.includes(interest) ? "✓ " : "+ "}
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="form-section">
            <span className="form-step">04</span>
            <div className="form-section-content">
              <h2>Make it your kind of trip.</h2>
              <p>Choose your approximate budget and travel pace.</p>

              <div className="form-two-columns">
                <label className="form-field">
                  <span>BUDGET PER PERSON</span>
                  <select
                    value={budget}
                    onChange={(event) => setBudget(event.target.value as Budget)}
                  >
                    <option value="budget">Budget-friendly</option>
                    <option value="moderate">Moderate</option>
                    <option value="premium">Premium</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>TRAVEL PACE</span>
                  <select
                    value={travelStyle}
                    onChange={(event) =>
                      setTravelStyle(event.target.value as Pace)
                    }
                  >
                    <option value="relaxed">Relaxed</option>
                    <option value="balanced">Balanced</option>
                    <option value="packed">See as much as possible</option>
                  </select>
                </label>
              </div>
            </div>
          </section>

          {error && (
            <p className="form-status form-status-error" role="alert">
              {error}
            </p>
          )}

          <div className="planner-form-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-inline" />
                  Generating itinerary...
                </>
              ) : isEditingSavedTrip ? (
                <>
                  Regenerate itinerary <span aria-hidden="true">→</span>
                </>
              ) : (
                <>
                  Create my itinerary <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
