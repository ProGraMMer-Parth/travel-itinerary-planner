import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL ?? "",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
};

export const isSupabaseConfigured = Boolean(
  supabaseConfig.url &&
    supabaseConfig.anonKey &&
    !supabaseConfig.url.includes("your-project")
);

export const supabase: SupabaseClient = createClient(
  supabaseConfig.url || "https://placeholder.supabase.co",
  supabaseConfig.anonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Concurrency guard: single-flight in-progress refresh to prevent stampedes
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refreshes the session via Supabase's supported SDK flow.
 * Uses a single-flight promise so concurrent callers share the same refresh operation.
 */
export async function refreshSessionToken(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session?.access_token) {
        // If the refresh token is expired, revoked, or invalid, clear local session safely
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore signout errors
        }
        return null;
      }
      return data.session.access_token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Obtains a valid, unexpired access token from the Supabase client.
 * Proactively refreshes if the access token has expired or is within 60s of expiring.
 */
export async function getValidSessionToken(providedToken?: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at ?? 0;
    // Check if expired or within 60-second expiration margin
    const isExpiredOrSoon = expiresAt > 0 && expiresAt - nowSec < 60;

    if (isExpiredOrSoon) {
      const refreshedToken = await refreshSessionToken();
      if (refreshedToken) {
        return refreshedToken;
      }
      return null;
    }

    // If storage has already been refreshed to a newer token than providedToken, prefer stored token
    if (providedToken && providedToken !== session.access_token) {
      return session.access_token;
    }

    return session.access_token;
  } catch {
    return null;
  }
}
