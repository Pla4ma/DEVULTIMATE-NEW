import { AlertTriangle, Loader2, ArrowRight, Eye, EyeOff, Zap } from "lucide-react";
import { useState } from "react";

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
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-5 animate-fade-in">
      {supabaseConfigError ? (
        <div className="flex items-start gap-3 px-4 py-4 rounded-xl" style={{ background: "var(--color-warning-soft)", border: "1px solid var(--color-warning-soft)" }}>
          <AlertTriangle size={16} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: 1 }} />
          <div className="text-sm space-y-1">
            <p className="font-medium" style={{ color: "var(--color-warning)" }}>Database not configured</p>
            <p style={{ color: "var(--text-tertiary)" }}>Use <strong style={{ color: "var(--text-secondary)" }}>Demo mode</strong> below to explore the platform.</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{supabaseConfigError}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--color-success-soft)", border: "1px solid var(--color-success-soft)" }}>
          <Zap size={14} style={{ color: "var(--color-success)", flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: "var(--color-success)" }}>
            Connected to Supabase. Your data is synced across sessions.
          </p>
        </div>
      )}

      <div className="flex rounded-xl p-1 gap-1" style={{ background: "var(--surface-2)" }}>
        {(["login", "signup"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={tab === t ? { background: "var(--signal)", color: "var(--surface-0)", boxShadow: "0 2px 8px var(--signal-glow)" } : { color: "var(--text-secondary)" }}
          >
            {t === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com" required autoComplete="email" disabled={!supabaseReady || loading}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all focus:ring-2"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === "login" ? "Your password" : "At least 6 characters"} required minLength={6}
              autoComplete={tab === "login" ? "current-password" : "new-password"} disabled={!supabaseReady || loading}
              className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all focus:ring-2"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }}>
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        {error && (
          <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-soft)", color: "var(--color-danger)" }}>
            {error}
          </div>
        )}
        {msg && (
          <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--color-success-soft)", border: "1px solid var(--color-success-soft)", color: "var(--color-success)" }}>
            {msg}
          </div>
        )}
        <button
          type="submit" disabled={loading || !supabaseReady}
          className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--signal)", color: "var(--surface-0)", boxShadow: "0 4px 14px var(--accent-cyan-glow)" }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {tab === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: "var(--border-default)" }} /></div>
        <div className="relative flex justify-center"><span className="px-3 text-xs" style={{ background: "var(--surface-0)", color: "var(--text-tertiary)" }}>or continue without account</span></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onAnon} disabled={loading || !supabaseReady}
          className="py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
        >
          Quick access
        </button>
        <button
          onClick={onDemo} disabled={loading}
          className="py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80 disabled:opacity-40 flex items-center justify-center gap-1.5"
          style={{ background: "var(--color-warning-soft)", border: "1px solid var(--color-warning-soft)", color: "var(--color-warning)" }}
          title="Limited to 2 scans and 3 reports. No persistent storage."
        >
          <Zap size={13} /> Demo mode
        </button>
      </div>
    </div>
  );
}
