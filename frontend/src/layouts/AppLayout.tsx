
import { useState } from 'react';

type AppLayoutProps = {
  children: React.ReactNode;
};

const navigation = [
  { label: 'Home', href: '#home' },
  { label: 'Explore Destinations', href: '#destinations' },
  { label: 'My Trips', href: '#my-trips' },
  { label: 'How It Works', href: '#how-it-works' },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <a
            className="brand"
            href="#home"
            aria-label="Trip Genius AI home"
            onClick={closeMenu}
          >
            <span className="brand-mark" aria-hidden="true">
              T<span className="brand-route">⌁</span>
            </span>
            <span className="brand-name">
              Trip Genius<span className="brand-ai"> AI</span>
            </span>
          </a>

          <nav className="desktop-nav" aria-label="Main navigation">
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`nav-link ${
                  item.label === 'Home' ? 'nav-link-active' : ''
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="header-actions">
            <a className="sign-in-link" href="#sign-in">
              Sign In
            </a>
            <a className="button button-primary header-cta" href="#planner">
              Plan My Trip <span aria-hidden="true">↗</span>
            </a>
          </div>

          <button
            type="button"
            className="mobile-menu-button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span>{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {menuOpen && (
          <nav
            id="mobile-navigation"
            className="mobile-nav"
            aria-label="Mobile navigation"
          >
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`mobile-nav-link ${
                  item.label === 'Home' ? 'nav-link-active' : ''
                }`}
                onClick={closeMenu}
              >
                {item.label}
              </a>
            ))}

            <a
              className="mobile-nav-link"
              href="#sign-in"
              onClick={closeMenu}
            >
              Sign In
            </a>

            <a
              className="button button-primary mobile-cta"
              href="#planner"
              onClick={closeMenu}
            >
              Plan My Trip <span aria-hidden="true">↗</span>
            </a>
          </nav>
        )}
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand-block">
            <a className="brand footer-brand" href="#home">
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
            <a href="#destinations">Explore destinations</a>
            <a href="#planner">Plan a trip</a>
            <a href="#my-trips">My trips</a>
            <a href="#help">Help &amp; support</a>
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
