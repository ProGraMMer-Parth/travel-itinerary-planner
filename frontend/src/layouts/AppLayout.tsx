import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export type NavigationTarget =
  | "home"
  | "planner"
  | "itinerary"
  | "my-trips"
  | "destinations"
  | "how-it-works";

export function getUserDisplayName(user: { email?: string; user_metadata?: Record<string, unknown> } | null): string {
  if (!user) return "";
  const meta = user.user_metadata;
  const fullName = typeof meta?.full_name === "string" ? meta.full_name.trim() : "";
  if (fullName) return fullName;

  const altName = typeof meta?.name === "string" ? meta.name.trim() : "";
  if (altName) return altName;

  if (user.email) {
    const prefix = user.email.split("@")[0].trim();
    if (prefix) return prefix;
  }

  return "Traveler";
}

type AppLayoutProps = {
  children: React.ReactNode;
  activePage?: string;
  onNavigate?: (target: NavigationTarget) => void;
  onOpenAuth?: () => void;
};

export default function AppLayout({
  children,
  activePage = "home",
  onNavigate,
  onOpenAuth,
}: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  function handleNav(target: NavigationTarget) {
    closeMenu();
    onNavigate?.(target);
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <a
            className="brand"
            href="#home"
            aria-label="Trip Genius AI home"
            onClick={(e) => {
              e.preventDefault();
              handleNav("home");
            }}
          >
            <span className="brand-mark" aria-hidden="true">
              T<span className="brand-route">⌁</span>
            </span>
            <span className="brand-name">
              Trip Genius<span className="brand-ai"> AI</span>
            </span>
          </a>

          <nav className="desktop-nav" aria-label="Main navigation">
            <button
              type="button"
              className={`nav-link nav-btn ${activePage === "home" ? "nav-link-active" : ""}`}
              onClick={() => handleNav("home")}
            >
              Home
            </button>
            <button
              type="button"
              className="nav-link nav-btn"
              onClick={() => handleNav("destinations")}
            >
              Explore Destinations
            </button>
            <button
              type="button"
              className={`nav-link nav-btn ${activePage === "my-trips" ? "nav-link-active" : ""}`}
              onClick={() => handleNav("my-trips")}
            >
              My Trips
            </button>
            <button
              type="button"
              className="nav-link nav-btn"
              onClick={() => handleNav("how-it-works")}
            >
              How It Works
            </button>
          </nav>

          <div className="header-actions">
            {user ? (
              <div className="user-profile-header">
                <span className="user-email-badge user-name-badge" title={user.email ?? ""}>
                  {getUserDisplayName(user)}
                </span>
                <button
                  type="button"
                  className="button button-secondary button-small sign-out-btn"
                  onClick={() => signOut()}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="sign-in-link sign-in-btn"
                onClick={onOpenAuth}
              >
                Sign In
              </button>
            )}
            <button
              type="button"
              className="button button-primary header-cta"
              onClick={() => handleNav("planner")}
            >
              Plan My Trip <span aria-hidden="true">↗</span>
            </button>
          </div>

          <button
            type="button"
            className="mobile-menu-button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span>{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>

        {menuOpen && (
          <nav
            id="mobile-navigation"
            className="mobile-nav"
            aria-label="Mobile navigation"
          >
            <button
              type="button"
              className={`mobile-nav-link nav-btn text-left ${activePage === "home" ? "nav-link-active" : ""}`}
              onClick={() => handleNav("home")}
            >
              Home
            </button>
            <button
              type="button"
              className="mobile-nav-link nav-btn text-left"
              onClick={() => handleNav("destinations")}
            >
              Explore Destinations
            </button>
            <button
              type="button"
              className={`mobile-nav-link nav-btn text-left ${activePage === "my-trips" ? "nav-link-active" : ""}`}
              onClick={() => handleNav("my-trips")}
            >
              My Trips
            </button>
            <button
              type="button"
              className="mobile-nav-link nav-btn text-left"
              onClick={() => handleNav("how-it-works")}
            >
              How It Works
            </button>

            {user ? (
              <div className="mobile-user-block">
                <span className="mobile-user-name">{getUserDisplayName(user)}</span>
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => {
                    signOut();
                    closeMenu();
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="mobile-nav-link nav-btn text-left"
                onClick={() => {
                  closeMenu();
                  onOpenAuth?.();
                }}
              >
                Sign In
              </button>
            )}

            <button
              type="button"
              className="button button-primary mobile-cta"
              onClick={() => handleNav("planner")}
            >
              Plan My Trip <span aria-hidden="true">↗</span>
            </button>
          </nav>
        )}
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand-block">
            <a
              className="brand footer-brand"
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                handleNav("home");
              }}
            >
              <span className="brand-mark" aria-hidden="true">
                T<span className="brand-route">⌁</span>
              </span>
              <span className="brand-name">
                Trip Genius<span className="brand-ai"> AI</span>
              </span>
            </a>
            <p>
              Your journey. Your way. Thoughtfully planned. Discover places
              you&apos;ll love and make every journey your own.
            </p>
          </div>

          <div className="footer-links">
            <button
              type="button"
              className="footer-nav-btn"
              onClick={() => handleNav("destinations")}
            >
              Explore destinations
            </button>
            <button
              type="button"
              className="footer-nav-btn"
              onClick={() => handleNav("planner")}
            >
              Plan a trip
            </button>
            <button
              type="button"
              className="footer-nav-btn"
              onClick={() => handleNav("my-trips")}
            >
              My trips
            </button>
            <button
              type="button"
              className="footer-nav-btn"
              onClick={() => handleNav("how-it-works")}
            >
              How it works
            </button>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Trip Genius AI</span>
            <span>Made for curious travellers.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
