
type ItineraryPageProps = {
  onBack: () => void;
};

export default function ItineraryPage({ onBack }: ItineraryPageProps) {
  return (
    <div className="planner-page">
      <div className="planner-page-inner">
        <button className="back-link" type="button" onClick={onBack}>
          ← Back to planner
        </button>

        <div className="planner-page-heading">
          <span className="section-kicker">YOUR JOURNEY, YOUR WAY</span>
          <h1>Your itinerary starts here.</h1>
          <p>
            Your trip preferences have been collected. The next step is to
            connect them to the itinerary generation service.
          </p>
        </div>

        <section className="trip-form">
          <h2>Ready to build your itinerary?</h2>
          <p>
            Once the backend is connected, this page will display your
            day-by-day activities, travel suggestions, and estimated costs.
          </p>

          <button
            className="button button-primary"
            type="button"
            onClick={onBack}
          >
            Edit trip preferences <span aria-hidden="true">→</span>
          </button>
        </section>
      </div>
    </div>
  );
}
