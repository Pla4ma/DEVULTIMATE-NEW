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
        <div className="flex items-start gap-3 px-4 py-4 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
          <AlertTriangle size={16} style={{ color: "var(--noctra-amber)", flexShrink: 0, marginTop: 1 }} />
          <div className="text-sm space-y-1">
            <p className="font-medium" style={{ color: "var(--noctra-amber)" }}>Database not configured</p>
            <p style={{ color: "var(--noctra-text-muted)" }}>Use <strong style={{ color: "var(--noctra-text-soft)" }}>Demo mode</strong> below to explore the platform.</p>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{supabaseConfigError}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <Zap size={14} style={{ color: "var(--noctra-emerald)", flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: "var(--noctra-emerald)" }}>
            Connected to Supabase. Your data is synced across sessions.
          </p>
        </div>
      )}

      <div className="flex rounded-xl p-1 gap-1" style={{ background: "var(--noctra-surface2)" }}>
        {(["login", "signup"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={tab === t ? { background: "var(--noctra-cyan)", color: "#000", boxShadow: "0 2px 8px rgba(61,216,255,0.3)" } : { color: "var(--noctra-text-soft)" }}
          >
            {t === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--noctra-text-muted)" }}>Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com" required autoComplete="email" disabled={!supabaseReady || loading}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all focus:ring-2"
            style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--noctra-text-muted)" }}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === "login" ? "Your password" : "At least 6 characters"} required minLength={6}
              autoComplete={tab === "login" ? "current-password" : "new-password"} disabled={!supabaseReady || loading}
              className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all focus:ring-2"
              style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--noctra-text-muted)" }}>
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        {error && (
          <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "var(--noctra-rose)" }}>
            {error}
          </div>
        )}
        {msg && (
          <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "var(--noctra-emerald)" }}>
            {msg}
          </div>
        )}
        <button
          type="submit" disabled={loading || !supabaseReady}
          className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--noctra-cyan)", color: "#000", boxShadow: "0 4px 14px rgba(61,216,255,0.25)" }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {tab === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: "var(--noctra-border)" }} /></div>
        <div className="relative flex justify-center"><span className="px-3 text-xs" style={{ background: "var(--noctra-bg)", color: "var(--noctra-text-muted)" }}>or continue without account</span></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onAnon} disabled={loading || !supabaseReady}
          className="py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)" }}
        >
          Quick access
        </button>
        <button
          onClick={onDemo} disabled={loading}
          className="py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80 disabled:opacity-40 flex items-center justify-center gap-1.5"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "var(--noctra-amber)" }}
          title="Limited to 2 scans and 3 reports. No persistent storage."
        >
          <Zap size={13} /> Demo mode
        </button>
      </div>
    </div>
  );
}
