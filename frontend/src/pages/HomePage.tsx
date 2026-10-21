type HomePageProps = {
  onPlanTrip: (destination: string, interests?: string[]) => void;
};

const destinations = [
  {
    name: "Kyoto, Japan",
    detail: "Temples, gardens & quiet streets",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=85",
    tag: "CULTURE & HERITAGE",
    interest: "Culture",
  },
  {
    name: "Amalfi Coast, Italy",
    detail: "Coastal villages & Mediterranean views",
    image:
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=85",
    tag: "SLOW TRAVEL",
    interest: "Relaxation",
  },
  {
    name: "Manali, India",
    detail: "Mountain air & Himalayan escapes",
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=85",
    tag: "NATURE & ADVENTURE",
    interest: "Nature",
  },
];

export default function HomePage({ onPlanTrip }: HomePageProps) {
  return (
    <div className="home-page" id="home">
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            TRAVEL PLANNING, THOUGHTFULLY REIMAGINED
          </span>

          <h1>
            Every journey,
            <br />
            <em>thoughtfully planned.</em>
          </h1>

          <p className="hero-description">
            Discover places you’ll love and turn your travel preferences into a
            personalized itinerary, built around your time, budget, and travel
            style.
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href="#planner">
              Start planning <span aria-hidden="true">↗</span>
            </a>
            <a className="text-link" href="#how-it-works">
              Discover how it works <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="hero-note">
            <span aria-hidden="true">✳</span>
            Your next adventure starts with an idea.
          </div>
        </div>

        <div className="hero-visual">
          <img
            className="hero-image"
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=85"
            alt="Beautiful alpine lake surrounded by mountains"
          />
          <div className="image-caption">
            <span className="caption-label">A WORLD OF POSSIBILITIES</span>
            <span className="caption-title">Find your somewhere.</span>
          </div>
          <div className="floating-note">
            <span className="floating-icon" aria-hidden="true">
              ✳
            </span>
            <div>
              <strong>Made for you</strong>
              <p>Your interests. Your pace. Your journey.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="quick-planner" id="planner">
        <div className="planner-heading">
          <span className="section-kicker">YOUR NEXT CHAPTER</span>
          <h2>Where will you go?</h2>
          <p>Start with a destination. We’ll help with the details.</p>
        </div>

        <form
          className="planner-form"
          onSubmit={(event) => {
            event.preventDefault();

            const form = event.currentTarget;
            const data = new FormData(form);
            const destination = String(data.get("destination") || "").trim();

            if (destination) {
              onPlanTrip(destination);
            }
          }}
        >
          <label className="destination-field">
            <span>DESTINATION</span>
            <input
              name="destination"
              type="text"
              placeholder="Where would you like to go?"
              required
            />
          </label>

          <button
            className="button button-primary planner-submit"
            type="submit"
          >
            Explore possibilities <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="planner-footnote">
          Not sure yet? Explore a little inspiration below.
        </p>
      </section>

      <section className="destinations-section" id="destinations">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">A LITTLE INSPIRATION</span>
            <h2>Places worth the journey.</h2>
            <p>From slow mornings to unforgettable landscapes.</p>
          </div>
          <a className="text-link destination-more" href="#planner">
            Find your destination <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="destination-grid">
          {destinations.map((destination) => (
            <article
              className="destination-card"
              key={destination.name}
              role="button"
              tabIndex={0}
              aria-label={`Plan a trip to ${destination.name}`}
              onClick={() => onPlanTrip(destination.name, [destination.interest])}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPlanTrip(destination.name, [destination.interest]);
                }
              }}
            >
              <div
                className="destination-image-link"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlanTrip(destination.name, [destination.interest]);
                }}
              >
                <img
                  className="destination-image"
                  src={destination.image}
                  alt={destination.name}
                  loading="lazy"
                />
                <span
                  className="destination-arrow"
                  aria-hidden="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlanTrip(destination.name, [destination.interest]);
                  }}
                >
                  ↗
                </span>
              </div>
              <div className="destination-info">
                <span className="destination-tag">{destination.tag}</span>
                <h3>{destination.name}</h3>
                <p>{destination.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-intro">
          <span className="section-kicker">LESS PLANNING, MORE WANDERING</span>
          <h2>A thoughtful trip, in three steps.</h2>
          <p>
            Good travel starts with what matters to you. Build a journey that
            feels like your own.
          </p>
        </div>

        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <h3>Tell us what you love</h3>
            <p>
              Share your destination, dates, interests, budget, and preferred
              pace.
            </p>
          </article>
          <article className="step-card">
            <span className="step-number">02</span>
            <h3>Shape your itinerary</h3>
            <p>
              Get a day-by-day starting plan tailored to your travel
              preferences.
            </p>
          </article>
          <article className="step-card">
            <span className="step-number">03</span>
            <h3>Make it yours</h3>
            <p>
              Refine your plans, keep track of your trips, and get ready to go.
            </p>
          </article>
        </div>
      </section>

      <section className="closing-banner">
        <div>
          <span className="section-kicker">YOUR NEXT ADVENTURE AWAITS</span>
          <h2>Make room for somewhere new.</h2>
          <p>A little inspiration is all it takes to begin.</p>
        </div>
        <a className="button closing-button" href="#planner">
          Plan your journey <span aria-hidden="true">↗</span>
        </a>
      </section>
    </div>
  );
}
