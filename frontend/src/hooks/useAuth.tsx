import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  getValidSessionToken,
  isSupabaseConfigured,
  supabase,
} from "../services/supabase";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  token: string | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: string | null; message?: string }>;
  signOut: () => Promise<void>;
  getValidToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep references to avoid stale closures in listeners
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;

  const userRef = useRef<User | null>(null);
  userRef.current = user;

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      if (!isSupabaseConfigured) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
      } catch (err) {
        console.warn("Could not retrieve initial Supabase session:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    if (!isSupabaseConfigured) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      // Avoid triggering re-renders if user ID and token are identical
      const prevToken = sessionRef.current?.access_token;
      const prevUserId = userRef.current?.id;
      const nextToken = currentSession?.access_token;
      const nextUserId = currentSession?.user?.id;

      if (prevToken === nextToken && prevUserId === nextUserId) {
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (!isSupabaseConfigured) return null;
    const activeToken = await getValidSessionToken();
    if (activeToken) {
      if (sessionRef.current?.access_token !== activeToken) {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user ?? null);
        }
      }
      return activeToken;
    }

    // Session is genuinely missing or expired and could not be refreshed
    if (sessionRef.current !== null) {
      setSession(null);
      setUser(null);
    }
    return null;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured. Please check your environment variables." };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "An unexpected error occurred during sign in.",
      };
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      if (!isSupabaseConfigured) {
        return { error: "Supabase is not configured. Please check your environment variables." };
      }
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: fullName
            ? {
                data: { full_name: fullName.trim() },
              }
            : undefined,
        });

        if (error) {
          return { error: error.message };
        }

        if (data.session) {
          return { error: null };
        }

        return {
          error: null,
          message:
            "Account created! Check your email to confirm your sign-up, or sign in directly.",
        };
      } catch (err) {
        return {
          error:
            err instanceof Error ? err.message : "An unexpected error occurred during sign up.",
        };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (err) {
      console.warn("Error signing out:", err);
    }
  }, []);

  const token = session?.access_token ?? null;

  const value = useMemo(
    () => ({
      user,
      session,
      token,
      loading,
      isConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      getValidToken,
    }),
    [user, session, token, loading, signIn, signUp, signOut, getValidToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
