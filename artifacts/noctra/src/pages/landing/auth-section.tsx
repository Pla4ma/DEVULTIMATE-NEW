import { motion } from "framer-motion";
import { useState } from "react";
import { Sparkles, Rocket, X, Loader2, ArrowRight, Eye, EyeOff, Zap } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { Magnetic } from "@/components/effects/Magnetic";
import { BeamButton } from "@/components/effects/BeamButton";

interface AuthSectionProps {
  onSubmit: (email: string, password: string, isLogin: boolean) => Promise<void>;
  onDemo: () => Promise<void>;
  onAnon?: () => Promise<void>;
  supabaseReady?: boolean;
  supabaseConfigError?: string | null;
}

export function AuthSection({
  onSubmit,
  onDemo,
  onAnon,
  supabaseReady = true,
  supabaseConfigError = null,
}: AuthSectionProps) {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);
    try {
      await onSubmit(email.trim(), password, isLogin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="auth"
      className="py-20 lg:py-28 relative overflow-hidden scroll-anchor"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(168,85,247,0.1) 0%, transparent 60%)",
        }}
      />

      <div className="section-container max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — pitch */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest mb-5"
              style={{
                background: "rgba(168,85,247,0.08)",
                border: "1px solid rgba(168,85,247,0.2)",
                color: "#c084fc",
              }}
            >
              <Rocket size={11} />
              Start in 60 seconds
            </div>
            <h2
              className="font-bold text-white mb-5 tracking-[-0.04em] leading-[1.05] text-balance"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Get your launch readiness score{" "}
              <span className="text-gradient-aurora">today</span>
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: "#b4aec8" }}>
              Point NOCTRA at your codebase, get an evidence-backed score, and
              start shipping with confidence. No credit card required.
            </p>
            <ul className="space-y-3 text-sm" style={{ color: "#b4aec8" }}>
              {[
                "Free 14-day trial of all Pro features",
                "Connect GitHub or drop a ZIP — your choice",
                "Export AI fix prompts to Cursor in one click",
                "Cancel anytime, your data is yours",
              ].map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span
                    className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5"
                    style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}
                  >
                    <Sparkles size={10} style={{ color: "#c084fc" }} />
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right — form card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative"
          >
            <div
              aria-hidden
              className="absolute -inset-4 -z-10 rounded-3xl opacity-50 blur-2xl"
              style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.3), transparent 60%)" }}
            />
            <div
              className="glass-2026 p-7 rounded-2xl"
              style={{
                background:
                  "linear-gradient(180deg, rgba(26,15,46,0.7) 0%, rgba(10,6,18,0.6) 100%)",
              }}
            >
              {supabaseConfigError ? (
                <div
                  className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5"
                  style={{
                    background: "rgba(234,179,8,0.08)",
                    border: "1px solid rgba(234,179,8,0.2)",
                  }}
                >
                  <Zap size={14} style={{ color: "#eab308", flexShrink: 0, marginTop: 1 }} />
                  <div className="text-xs" style={{ color: "#b4aec8" }}>
                    Use{" "}
                    <strong style={{ color: "#f5f0ff" }}>Demo mode</strong> to
                    explore the platform.
                  </div>
                </div>
              ) : null}

              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: "rgba(255,255,255,0.03)" }}>
                {[
                  { l: "Sign up", v: false },
                  { l: "Sign in", v: true },
                ].map((t) => (
                  <button
                    key={t.l}
                    onClick={() => setIsLogin(t.v)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: isLogin === t.v ? "rgba(168,85,247,0.15)" : "transparent",
                      color: isLogin === t.v ? "#e9d5ff" : "#7a7390",
                      border: isLogin === t.v ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
                    }}
                  >
                    {t.l}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider mb-1.5 block" style={{ color: "#7a7390" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                    disabled={!supabaseReady || loading}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#f5f0ff",
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider mb-1.5 block" style={{ color: "#7a7390" }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isLogin ? "Your password" : "At least 6 characters"}
                      required
                      minLength={6}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      disabled={!supabaseReady || loading}
                      className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#f5f0ff",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "#7a7390" }}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    className="px-3 py-2 rounded-lg text-xs"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#f87171",
                    }}
                  >
                    {error}
                  </div>
                )}
                {msg && (
                  <div
                    className="px-3 py-2 rounded-lg text-xs"
                    style={{
                      background: "rgba(34,197,94,0.08)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      color: "#22c55e",
                    }}
                  >
                    {msg}
                  </div>
                )}

                <Magnetic strength={0.2}>
                  <BeamButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={loading || !supabaseReady}
                    icon={loading ? <Loader2 size={14} className="animate-spin" /> : null}
                    iconRight={!loading ? <ArrowRight size={16} /> : null}
                  >
                    {loading ? "Loading..." : isLogin ? "Sign in" : "Create account"}
                  </BeamButton>
                </Magnetic>
              </form>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "#4a4560" }}>
                  or
                </span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {onAnon && (
                  <button
                    onClick={onAnon}
                    disabled={loading || !supabaseReady}
                    className="py-2.5 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#b4aec8",
                    }}
                  >
                    Quick access
                  </button>
                )}
                <button
                  onClick={onDemo}
                  disabled={loading}
                  className="py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 col-span-2"
                  style={{
                    background: "rgba(234,179,8,0.06)",
                    border: "1px solid rgba(234,179,8,0.2)",
                    color: "#fbbf24",
                  }}
                  title="Limited to 2 scans and 3 reports. No persistent storage."
                >
                  <Zap size={12} /> Try demo mode (no signup)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
