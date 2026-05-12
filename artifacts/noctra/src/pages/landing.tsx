import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { supabaseConfigError } from "@/integrations/supabase/client";
import { Zap, ArrowRight, Loader2, Brain, Target, FlaskConical, Rocket, AlertTriangle } from "lucide-react";

export default function LandingPage() {
  const { signIn, signUp, signInAnon, signInDemo, user } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/app");
    }
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMsg("");
    setLoading(true);
    try {
      if (tab === "login") {
        await signIn(email, password);
        navigate("/app");
      } else {
        const { needsEmailConfirmation } = await signUp(email, password);
        if (needsEmailConfirmation) {
          setMsg("Check your email to confirm your account.");
        } else {
          navigate("/app");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnon() {
    setError(""); setLoading(true);
    try {
      await signInAnon();
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anonymous login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setError(""); setLoading(true);
    try {
      await signInDemo();
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo mode failed");
    } finally {
      setLoading(false);
    }
  }

  const features = [
    { icon: Target, label: "Signal Chamber", desc: "Stress-test any idea in minutes" },
    { icon: Brain, label: "Pressure Matrix", desc: "Surface your blind spots" },
    { icon: FlaskConical, label: "Proof Reactor", desc: "Quantify validation depth" },
    { icon: Rocket, label: "Launch Control", desc: "Go/no-go with full telemetry" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--noctra-bg)" }}>
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--noctra-border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--noctra-cyan)" }}>
            <Zap size={16} className="text-black" />
          </div>
          <span className="font-bold tracking-wide" style={{ color: "var(--noctra-text)" }}>NOCTRA</span>
        </div>
        <span className="text-xs px-2 py-1 rounded" style={{ background: "var(--noctra-surface2)", color: "var(--noctra-text-muted)" }}>Developer Intelligence OS</span>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-16 px-6 py-16 max-w-6xl mx-auto w-full">
        {/* Left */}
        <div className="flex-1 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-6" style={{ background: "rgba(61,216,255,0.08)", border: "1px solid rgba(61,216,255,0.2)", color: "var(--noctra-cyan)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Intelligence OS — Live
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4" style={{ color: "var(--noctra-text)" }}>
            Build smarter.<br />
            <span style={{ color: "var(--noctra-cyan)" }}>Ship with proof.</span>
          </h1>
          <p className="text-lg mb-8 leading-relaxed" style={{ color: "var(--noctra-text-soft)" }}>
            Noctra is the AI intelligence OS that turns founder instinct into validated signal. From raw idea to launch-ready — fully instrumented.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-xl p-3 border" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                <Icon size={16} className="mb-2" style={{ color: "var(--noctra-cyan)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>{label}</p>
                <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Auth */}
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border p-6" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
            {/* Supabase not configured notice */}
            {supabaseConfigError ? (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg mb-4 text-xs" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
                <AlertTriangle size={13} style={{ color: "var(--noctra-amber)", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className="font-medium mb-0.5" style={{ color: "var(--noctra-amber)" }}>Database not connected</p>
                  <p style={{ color: "var(--noctra-text-muted)" }}>Use <strong style={{ color: "var(--noctra-text-soft)" }}>Demo mode</strong> below to explore the app without credentials.</p>
                </div>
              </div>
            ) : null}
            {/* Tabs */}
            <div className="flex rounded-lg p-1 mb-6 gap-1" style={{ background: "var(--noctra-surface2)" }}>
              {(["login", "signup"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(""); setMsg(""); }}
                  className="flex-1 py-1.5 rounded-md text-sm font-medium transition-all"
                  style={tab === t ? { background: "var(--noctra-cyan)", color: "#000" } : { color: "var(--noctra-text-soft)" }}
                >
                  {t === "login" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email" required
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
              />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" required minLength={6}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
              />
              {error && <p className="text-xs" style={{ color: "var(--noctra-rose)" }}>{error}</p>}
              {msg && <p className="text-xs" style={{ color: "var(--noctra-emerald)" }}>{msg}</p>}
              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
                style={{ background: "var(--noctra-cyan)", color: "#000", opacity: loading ? 0.6 : 1 }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                {tab === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAnon} disabled={loading}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)", opacity: loading ? 0.5 : 1 }}
              >
                Quick access
              </button>
              <button
                onClick={handleDemo} disabled={loading}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)", opacity: loading ? 0.5 : 1 }}
              >
                Demo mode
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
