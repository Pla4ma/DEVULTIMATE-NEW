import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase, supabaseConfigError, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { isDemoMode, enableDemoMode, disableDemoMode, getDemoUser } from "@/lib/demo-mode";

const ANON_KEY = "noctra_anon_creds";

function getOrCreateAnonCreds(): { email: string; password: string } {
  const stored = localStorage.getItem(ANON_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { /* fall through */ }
  }
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const creds = {
    email: `anon_${id}@noctra.app`,
    password: crypto.randomUUID(),
  };
  localStorage.setItem(ANON_KEY, JSON.stringify(creds));
  return creds;
}

function buildDemoUser(): User {
  const u = getDemoUser() ?? enableDemoMode();
  return {
    id: u.id,
    aud: "authenticated",
    role: "authenticated",
    email: u.email,
    app_metadata: { provider: "demo", providers: ["demo"] },
    user_metadata: { display_name: "Demo Founder", demo: true },
    created_at: new Date().toISOString(),
  } as unknown as User;
}

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInAnon: () => Promise<void>;
  signInDemo: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      setUser(buildDemoUser());
      setSession(null);
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured()) {
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error(supabaseConfigError ?? "Supabase is not configured.");
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error(supabaseConfigError ?? "Supabase is not configured.");
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/app` },
    });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session };
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      throw new Error(supabaseConfigError ?? "Supabase is not configured.");
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (isDemoMode()) {
      disableDemoMode();
      setUser(null);
      setSession(null);
      return;
    }
    if (!isSupabaseConfigured()) {
      setUser(null);
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const signInDemo = async () => {
    const u = enableDemoMode();
    setUser(buildDemoUser());
    setSession(null);
    void u;
  };

  const signInAnon = async () => {
    if (!isSupabaseConfigured()) {
      throw new Error(supabaseConfigError ?? "Supabase is not configured.");
    }
    const { error: anonErr } = await supabase.auth.signInAnonymously();
    if (!anonErr) return;

    const creds = getOrCreateAnonCreds();
    const { error: signInErr } = await supabase.auth.signInWithPassword(creds);
    if (!signInErr) return;

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: creds.email,
      password: creds.password,
      options: { data: { display_name: "Anonymous Founder" } },
    });
    if (signUpErr) throw signUpErr;
    if (signUpData.session) return;

    const { error: finalErr } = await supabase.auth.signInWithPassword(creds);
    if (finalErr) {
      throw new Error(
        "Anonymous access is disabled in Supabase. Sign up with email or use Demo Mode.",
      );
    }
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      isDemo: isDemoMode(),
      signIn, signUp, signInWithGoogle, signOut, signInAnon, signInDemo,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
