import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
  onSuccess?: () => void;
};

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "signin",
  onSuccess,
}: AuthModalProps) {
  const { signIn, signUp, isConfigured } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (mode === "signup") {
      if (!fullName.trim()) {
        setNameError("Full name is required.");
        return;
      }
    }

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const res = await signIn(email, password);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          onSuccess?.();
          onClose();
        }
      } else {
        const res = await signUp(email, password, fullName);
        if (res.error) {
          setErrorMessage(res.error);
        } else if (res.message) {
          setInfoMessage(res.message);
        } else {
          onSuccess?.();
          onClose();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="auth-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={handleOverlayClick}
    >
      <div className="auth-modal-content">
        <button
          className="auth-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ✕
        </button>

        <div className="auth-modal-header">
          <span className="brand-mark" aria-hidden="true">
            T<span className="brand-route">⌁</span>
          </span>
          <h2 id="auth-modal-title" className="auth-modal-title">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="auth-modal-subtitle">
            {mode === "signin"
              ? "Sign in to save and manage your personalized travel itineraries."
              : "Join Trip Genius AI to save your trips and access them anytime."}
          </p>
        </div>

        {!isConfigured && (
          <div className="auth-alert auth-alert-warning" role="alert">
            Supabase keys are not configured yet. Sign in and trip saving will be disabled until configured.
          </div>
        )}

        {errorMessage && (
          <div className="auth-alert auth-alert-error" role="alert">
            {errorMessage}
          </div>
        )}

        {infoMessage && (
          <div className="auth-alert auth-alert-info" role="status">
            {infoMessage}
          </div>
        )}

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "signin" ? "auth-tab-active" : ""}`}
            onClick={() => {
              setMode("signin");
              setNameError(null);
              setErrorMessage(null);
              setInfoMessage(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "signup" ? "auth-tab-active" : ""}`}
            onClick={() => {
              setMode("signup");
              setNameError(null);
              setErrorMessage(null);
              setInfoMessage(null);
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {mode === "signup" && (
            <div className="form-group">
              <label htmlFor="auth-name" className="form-label">
                Full name *
              </label>
              <input
                id="auth-name"
                type="text"
                className={`form-input ${nameError ? "form-input-error" : ""}`}
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (nameError && e.target.value.trim().length > 0) {
                    setNameError(null);
                  }
                }}
                disabled={loading}
              />
              {nameError && (
                <span className="field-error-text" role="alert">
                  {nameError}
                </span>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email" className="form-label">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password" className="form-label">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
            {mode === "signup" && (
              <small className="field-hint">Must be at least 6 characters</small>
            )}
          </div>

          <button
            type="submit"
            className="button button-primary auth-submit-btn"
            disabled={loading || !isConfigured}
          >
            {loading ? (
              <span className="spinner-inline">Processing...</span>
            ) : mode === "signin" ? (
              "Sign In to Your Account"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="auth-footer-prompt">
          {mode === "signin" ? (
            <p>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="auth-link-button"
                onClick={() => {
                  setMode("signup");
                  setNameError(null);
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
              >
                Sign up free
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="auth-link-button"
                onClick={() => {
                  setMode("signin");
                  setNameError(null);
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
