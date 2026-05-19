import { AlertTriangle, Loader2, ArrowRight } from "lucide-react";

interface LandingAuthSectionProps {
  tab: "login" | "signup";
  setTab: (t: "login" | "signup") => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loading: boolean;
  error: string;
  msg: string;
  supabaseConfigError: string | null;
  supabaseReady: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onAnon: () => void;
  onDemo: () => void;
}

export function LandingAuthSection({
  tab, setTab, email, setEmail, password, setPassword,
  loading, error, msg, supabaseConfigError, supabaseReady,
  onSubmit, onAnon, onDemo,
}: LandingAuthSectionProps) {
  return (
    <section id="auth" className="py-20 px-6 border-t" style={{ borderColor: "var(--noctra-border)" }}>
      <div className="max-w-md mx-auto">
        <div className="rounded-2xl border p-8" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
          {supabaseConfigError ? (
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg mb-6 text-sm" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
              <AlertTriangle size={16} style={{ color: "var(--noctra-amber)", flexShrink: 0 }} />
              <div>
                <p className="font-medium mb-1" style={{ color: "var(--noctra-amber)" }}>Database not connected</p>
                <p style={{ color: "var(--noctra-text-muted)" }}>{supabaseConfigError}</p>
                <p style={{ color: "var(--noctra-text-muted)" }}>Use <strong style={{ color: "var(--noctra-text-soft)" }}>Demo mode</strong> to explore.</p>
              </div>
            </div>
          ) : null}

          <div className="flex rounded-lg p-1 mb-6 gap-1" style={{ background: "var(--noctra-surface2)" }}>
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); }}
                className="flex-1 py-2 rounded-md text-sm font-medium transition-all"
                style={tab === t ? { background: "var(--noctra-cyan)", color: "#000" } : { color: "var(--noctra-text-soft)" }}
              >
                {t === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email" required autoComplete="email" disabled={!supabaseReady || loading}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
              style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
            />
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" required minLength={6}
              autoComplete={tab === "login" ? "current-password" : "new-password"} disabled={!supabaseReady || loading}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
              style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
            />
            {error && <p className="text-sm" style={{ color: "var(--noctra-rose)" }}>{error}</p>}
            {msg && <p className="text-sm" style={{ color: "var(--noctra-emerald)" }}>{msg}</p>}
            <button
              type="submit" disabled={loading || !supabaseReady}
              className="w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
              style={{ background: "var(--noctra-cyan)", color: "#000", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              {tab === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="flex gap-3 mt-4">
            <button
              onClick={onAnon} disabled={loading || !supabaseReady}
              className="flex-1 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)", opacity: loading ? 0.5 : 1 }}
            >
              Quick access
            </button>
            <button
              onClick={onDemo} disabled={loading}
              className="flex-1 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)", opacity: loading ? 0.5 : 1 }}
              title="Limited to 2 scans and 3 reports. No persistent storage."
            >
              Demo mode
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
