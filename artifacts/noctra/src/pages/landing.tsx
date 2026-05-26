import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { supabaseConfigError } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, ArrowRight, Play, Sparkles, Star, Stethoscope, CheckCircle, Code,
  Terminal, RotateCcw, Target, Rocket, Brain, Lightbulb, Users, BarChart3,
  Shield, Clock, TrendingUp, Globe, Cpu, Database, GitBranch,
} from "lucide-react";

const FEATURES = [
  { icon: Lightbulb, title: "Idea Lab", desc: "Validate ideas, stress-test assumptions, simulate market demand.", color: "var(--accent-violet)" },
  { icon: Stethoscope, title: "Code Health", desc: "Scan codebases, diagnose blockers, get go/no-go signals.", color: "var(--color-danger)" },
  { icon: Rocket, title: "Build Planner", desc: "Plan MVP scope, generate build plans, track execution.", color: "var(--color-success)" },
  { icon: Brain, title: "Project Brain", desc: "Persistent AI memory with deep project intelligence.", color: "var(--accent-magenta)" },
];

const STATS = [
  { value: "10K+", label: "Projects analyzed" },
  { value: "95%", label: "Faster validation" },
  { value: "3x", label: "Launch confidence" },
  { value: "< 2min", label: "Time to first insight" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Describe", desc: "Tell us about your idea or upload your codebase." },
  { step: "02", title: "Analyze", desc: "AI scans, validates, and stress-tests everything." },
  { step: "03", title: "Fix", desc: "Get prioritized tasks and fix what matters." },
  { step: "04", title: "Ship", desc: "Launch with evidence-backed confidence." },
];

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  const { signIn, signUp, signInDemo, user } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const supabaseReady = !supabaseConfigError;

  useEffect(() => {
    if (user) navigate("/app");
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMsg("");
    if (!supabaseReady) { setError(supabaseConfigError ?? "Supabase is not configured."); return; }
    setLoading(true);
    try {
      if (tab === "login") { await signIn(email.trim(), password); navigate("/app"); }
      else {
        const { needsEmailConfirmation } = await signUp(email.trim(), password);
        if (needsEmailConfirmation) { setMsg("Check your email to confirm your account."); }
        else navigate("/app");
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setLoading(false); }
  }

  async function handleDemo() {
    setError(""); setLoading(true);
    try { await signInDemo(); navigate("/app"); }
    catch (err) { setError(err instanceof Error ? err.message : "Demo mode failed"); }
    finally { setLoading(false); }
  }

  function openAuth(t: "login" | "signup") {
    setTab(t); setShowAuth(true); setError(""); setMsg("");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--surface-0)" }}>
      <header className="sticky top-0 z-50 glass border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center animate-glow"
              style={{ background: "var(--accent-cyan)" }}
            >
              <Zap size={18} className="text-black" />
            </motion.div>
            <span className="font-bold text-lg tracking-wide" style={{ color: "var(--text-primary)" }}>NOCTRA</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>Features</a>
            <a href="#how-it-works" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>How It Works</a>
            <button onClick={() => navigate("/pricing")} className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>Pricing</button>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => openAuth("login")} className="text-sm px-4 py-2 rounded-lg hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>Sign in</button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openAuth("signup")}
              className="text-sm px-4 py-2 rounded-lg font-medium"
              style={{ background: "var(--accent-cyan)", color: "#000" }}
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </header>

      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--accent-cyan)", opacity: 0.1 }} />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--accent-violet)", opacity: 0.1 }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs mb-6"
              style={{ background: "var(--accent-cyan-soft)", border: "1px solid var(--accent-cyan)", color: "var(--accent-cyan)" }}
            >
              <Sparkles size={12} />
              <span>AI-Powered Launch Intelligence</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6" style={{ color: "var(--text-primary)" }}>
              Ship with evidence,
              <br />
              <span style={{ background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>not hope.</span>
            </h1>

            <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              The AI co-founder that helps you validate ideas, diagnose codebases, and launch with confidence. From idea to launch — one scan at a time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 40px var(--accent-cyan-glow)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openAuth("signup")}
                className="px-8 py-4 rounded-xl text-base font-semibold flex items-center gap-2"
                style={{ background: "var(--accent-cyan)", color: "#000", boxShadow: "var(--shadow-glow)" }}
              >
                <Play size={16} /> Start Free Analysis
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDemo}
                className="px-8 py-4 rounded-xl text-base font-medium flex items-center gap-2"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              >
                <Sparkles size={16} /> Try Demo Mode
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-xl)" }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--color-danger)" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--color-warning)" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--color-success)" }} />
                <span className="ml-2 text-xs" style={{ color: "var(--text-quaternary)" }}>NOCTRA — Command Center</span>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Launch Score", value: "87", color: "var(--color-success)" },
                    { label: "Blockers", value: "2", color: "var(--color-danger)" },
                    { label: "Tasks", value: "12", color: "var(--accent-cyan)" },
                    { label: "Reports", value: "8", color: "var(--accent-violet)" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg p-3" style={{ background: "var(--surface-2)" }}>
                      <p className="text-[10px] mb-1" style={{ color: "var(--text-tertiary)" }}>{stat.label}</p>
                      <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "87%" }}
                    transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, var(--accent-cyan), var(--color-success))" }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 border-y" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold mb-1" style={{ color: "var(--accent-cyan)" }}>{stat.value}</p>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-24 px-4 sm:px-6" style={{ background: "var(--surface-0)" }}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--accent-cyan)" }}>The Launch Intelligence Stack</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Everything you need to ship with confidence</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>Four integrated experiences that take you from idea to launch.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, boxShadow: "var(--shadow-lg)" }}
                className="group p-6 rounded-2xl border transition-all"
                style={{ background: "var(--surface-1)", borderColor: "var(--border-default)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{title}</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 px-4 sm:px-6 border-t" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--accent-violet)" }}>The Workflow</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>From scan to launch in 4 steps</h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="p-6 rounded-2xl h-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
                  <span className="text-5xl font-bold opacity-10" style={{ color: "var(--accent-cyan)" }}>{step}</span>
                  <h3 className="text-lg font-semibold mt-2 mb-2" style={{ color: "var(--text-primary)" }}>{title}</h3>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{desc}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2">
                    <ArrowRight size={16} style={{ color: "var(--text-quaternary)" }} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 relative overflow-hidden" style={{ background: "var(--surface-0)" }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-violet) 100%)", opacity: 0.05 }} />
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Ready to ship with evidence?</h2>
          <p className="text-lg mb-8" style={{ color: "var(--text-secondary)" }}>Join thousands of developers who catch launch blockers before they ship.</p>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 40px var(--accent-cyan-glow)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openAuth("signup")}
            className="px-8 py-4 rounded-xl text-base font-semibold"
            style={{ background: "var(--accent-cyan)", color: "#000", boxShadow: "var(--shadow-glow)" }}
          >
            Start Free — No Credit Card
          </motion.button>
        </motion.div>
      </section>

      <AnimatePresence>
        {showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAuth(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-md rounded-2xl border p-8"
              style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-xl)" }}
            >
              <button onClick={() => setShowAuth(false)} className="absolute top-4 right-4 text-sm" style={{ color: "var(--text-tertiary)" }}>✕</button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-cyan)" }}>
                  <Zap size={18} className="text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{tab === "login" ? "Welcome back" : "Create account"}</h3>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Start shipping with evidence</p>
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                {(["login", "signup"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(""); setMsg(""); }}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: tab === t ? "var(--accent-cyan-soft)" : "var(--surface-2)",
                      color: tab === t ? "var(--accent-cyan)" : "var(--text-tertiary)",
                      border: `1px solid ${tab === t ? "var(--accent-cyan)" : "var(--border-default)"}`,
                    }}
                  >
                    {t === "login" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  />
                </div>

                {error && (
                  <p className="text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>
                )}
                {msg && (
                  <p className="text-xs" style={{ color: "var(--color-success)" }}>{msg}</p>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold"
                  style={{ background: "var(--accent-cyan)", color: "#000", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Loading..." : tab === "login" ? "Sign In" : "Create Account"}
                </motion.button>
              </form>

              <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleDemo}
                  className="w-full py-3 rounded-xl text-sm font-medium"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
                >
                  <Sparkles size={14} className="inline mr-2" />
                  Try Demo Mode
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="border-t px-4 sm:px-6 py-8" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-cyan)" }}>
              <Zap size={12} className="text-black" />
            </div>
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>NOCTRA</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="text-xs hover:opacity-80 transition-opacity" style={{ color: "var(--text-tertiary)" }}>Privacy</a>
            <span className="text-xs" style={{ color: "var(--text-quaternary)" }}>·</span>
            <a href="/pricing" className="text-xs hover:opacity-80 transition-opacity" style={{ color: "var(--text-tertiary)" }}>Pricing</a>
          </div>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>© 2026 NOCTRA. Ship with evidence.</p>
        </div>
      </footer>
    </div>
  );
}
