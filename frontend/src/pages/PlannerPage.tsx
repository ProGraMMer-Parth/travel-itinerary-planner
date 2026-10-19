import { useState } from "react";

type PlannerPageProps = {
  initialDestination: string;
  onBack: () => void;
  onGenerate: () => void;
};

export default function PlannerPage({
  initialDestination,
  onBack,
  onGenerate,
}: PlannerPageProps) {
  const [destination, setDestination] = useState(initialDestination);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("moderate");
  const [travelStyle, setTravelStyle] = useState("balanced");
  const [interests, setInterests] = useState<string[]>(["Culture"]);

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // The preferences will be connected to the itinerary generator next.
    onGenerate();
  }

  return (
    <div className="planner-page">
      <div className="planner-page-inner">
        <button className="back-link" type="button" onClick={onBack}>
          ← Back to home
        </button>

        <div className="planner-page-heading">
          <span className="section-kicker">YOUR JOURNEY STARTS HERE</span>
          <h1>Let&apos;s plan something wonderful.</h1>
          <p>
            Tell us a little about your trip. We&apos;ll help you shape a
            journey around the things you love.
          </p>
        </div>

        <form className="trip-form" onSubmit={handleSubmit}>
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
                    onChange={(event) => setBudget(event.target.value)}
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
                    onChange={(event) => setTravelStyle(event.target.value)}
                  >
                    <option value="relaxed">Relaxed</option>
                    <option value="balanced">Balanced</option>
                    <option value="packed">See as much as possible</option>
                  </select>
                </label>
              </div>
            </div>
          </section>

          <div className="planner-form-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={onBack}
            >
              Cancel
            </button>
            <button className="button button-primary" type="submit">
              Create my itinerary <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
