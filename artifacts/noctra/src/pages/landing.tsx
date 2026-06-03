import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { supabaseConfigError } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Play, Star, Stethoscope, Brain, Zap, TrendingUp,
  Check, ArrowRight, BarChart3, Layers, Database,
  BrainCircuit, Lock, Gauge, CheckCircle, XCircle,
  Shield, RefreshCw, ChevronRight,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { AnimatedBackground } from "@/components/effects/AnimatedBackground";
import { AuthModal } from "./landing/AuthModal";

/* ─── Data ───────────────────────────────────────────────────────────── */

const TRUSTED_BY = ["Stripe","Vercel","Linear","Notion","Figma","Raycast","Supabase","GitHub"];

const STATS = [
  { value: "94%", label: "Blocker Detection", accent: "orange" },
  { value: "$2.4M", label: "Revenue Saved", accent: "violet" },
  { value: "1,200+", label: "Active Teams", accent: "orange" },
  { value: "32%", label: "Churn Reduction", accent: "violet" },
];

const FEATURES = [
  { icon: BrainCircuit, title: "AI Launch Readiness Scoring",
    description: "Analyze 50+ data points across your codebase to predict launch blockers with 94% accuracy.",
    metric: "94%", metricLabel: "accuracy", accent: "violet" },
  { icon: BarChart3, title: "Codebase Intelligence",
    description: "Predict your next 6 months of technical debt before it becomes an emergency that costs users.",
    metric: "6mo", metricLabel: "forecast", accent: "orange" },
  { icon: Layers, title: "Predictive Build Analytics",
    description: "Know which features will ship over budget. AI monitors project health and scope creep in real time.",
    metric: "实时", metricLabel: "monitoring", accent: "violet" },
  { icon: Zap, title: "AI-Generated Fix Prompts",
    description: "Get specific, actionable prompts you can paste into Cursor or Copilot to resolve blockers immediately.",
    metric: "<2min", metricLabel: "to fix", accent: "orange" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Connect Your Code",
    description: "Import your repo via ZIP or GitHub. Our engine analyzes structure, dependencies, security posture, and code quality.", accent: "violet" },
  { step: "02", title: "AI Analyzes Patterns",
    description: "Our AI engine processes your codebase, identifies anti-patterns, and scores launch readiness based on real-world shipping data.", accent: "orange" },
  { step: "03", title: "Get Actionable Insights",
    description: "Receive AI-generated insights with file-level evidence. Know exactly what needs attention, why, and how to fix it.", accent: "violet" },
  { step: "04", title: "Ship With Confidence",
    description: "Track improvements with every rescan. Watch your launch score climb as blockers resolve, and ship when you hit green.", accent: "orange" },
];

const PLANS = [
  { name: "Starter", price: "$99", period: "/month", description: "For solo consultants & small agencies",
    features: ["Up to 25 clients","Basic health scoring","Revenue tracking","3 AI insights/month","Email support"],
    cta: "Start Free Trial", popular: false },
  { name: "Professional", price: "$249", period: "/month", description: "For growing firms with 10-50 clients",
    features: ["Unlimited clients","Advanced AI health scoring","Revenue forecasting","Unlimited AI insights","Predictive churn analytics","Priority support","Team collaboration"],
    cta: "Start Free Trial", popular: true },
  { name: "Enterprise", price: "$499", period: "/month", description: "For established firms with 50+ clients",
    features: ["Everything in Pro","Custom AI models","SSO & audit logs","Dedicated onboarding","SLA-backed support","API access","White-label options"],
    cta: "Contact Sales", popular: false },
];

const TESTIMONIALS = [
  { quote: "NOCTRA found 3 launch blockers we didn't know existed. We shipped 2 weeks early.", author: "Sarah Chen", role: "CTO, Helix Labs", metric: "2w", metricLabel: "early", accent: "violet" },
  { quote: "The AI fix prompts are surgical. What used to take days of debugging now takes 20 minutes.", author: "Marcus Rivera", role: "Founder, Orbit", metric: "20min", metricLabel: "to fix", accent: "orange" },
  { quote: "Our launch readiness score went from 34 to 87 in 6 weeks. The evidence-based approach changed how we ship.", author: "Aisha Patel", role: "VP Eng, Convex", metric: "87", metricLabel: "score", accent: "violet" },
];

/* ─── Accent Helpers ─────────────────────────────────────────────────── */

function accentColor(name: string, type: "hex" | "rgb" | "bg" | "border" | "glow" = "hex") {
  const isOrange = name === "orange";
  const hex = isOrange ? "#f97316" : "#8b5cf6";
  const rgb = isOrange ? "249,115,22" : "139,92,246";
  const lightHex = isOrange ? "#fb923c" : "#a78bfa";
  if (type === "hex") return hex;
  if (type === "rgb") return rgb;
  if (type === "bg") return `rgba(${rgb},0.1)`;
  if (type === "border") return `rgba(${rgb},0.25)`;
  if (type === "glow") return `rgba(${rgb},0.15)`;
  return hex;
}

/* ─── Animation Presets ────────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true, margin: "-80px" },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
  viewport: { once: true },
};

/* ─── Dashboard Mockup ───────────────────────────────────────────────── */

function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="relative w-full max-w-5xl mx-auto"
    >
      {/* Glow behind mockup */}
      <div className="absolute -inset-8 rounded-3xl opacity-30 blur-3xl -z-10"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.3) 0%, rgba(249,115,22,0.2) 50%, transparent 70%)" }} />

      <div className="rounded-xl overflow-hidden border"
        style={{
          background: "#080810",
          borderColor: "rgba(139, 92, 246, 0.15)",
          boxShadow: "0 25px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}>
        {/* Browser chrome */}
        <div className="flex items-center gap-3 px-5 py-3 border-b"
          style={{ borderColor: "rgba(255,255,255,0.05)", background: "#080810" }}>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "#f97316" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#a78bfa" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-mono"
              style={{ background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}>
              <Lock size={10} /><span>app.noctra.dev</span>
            </div>
          </div>
          <div className="w-16" />
        </div>

        <div className="p-5 grid grid-cols-12 gap-3">
          {/* Sidebar */}
          <div className="col-span-2 space-y-1">
            {[{ icon: Gauge, label: "Dashboard", active: true },
              { icon: Stethoscope, label: "Health", active: false },
              { icon: Brain, label: "Brain", active: false },
              { icon: BarChart3, label: "Analytics", active: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]"
                style={{
                  background: item.active ? "rgba(139, 92, 246, 0.12)" : "transparent",
                  color: item.active ? "#a78bfa" : "rgba(255,255,255,0.4)",
                  border: item.active ? "1px solid rgba(139, 92, 246, 0.25)" : "1px solid transparent",
                }}>
                <item.icon size={13} strokeWidth={item.active ? 2 : 1.5} />
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="col-span-10 space-y-3">
            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-3">
              {[{ label: "Launch Score", value: "87", color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.15)", width: "87%" },
                { label: "Blockers", value: "3", color: "#ef4444", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.12)", width: "30%" },
                { label: "Health Trend", value: "+12%", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.15)", width: "65%" },
              ].map((card) => (
                <div key={card.label} className="rounded-xl p-3.5"
                  style={{ background: card.bg, border: `1px solid ${card.border}` }}>
                  <p className="text-[9px] uppercase tracking-[0.15em] mb-2 font-medium" style={{ color: card.color, opacity: 0.8 }}>{card.label}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
                    <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: card.width, background: card.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="rounded-xl p-4"
              style={{ background: "rgba(139, 92, 246, 0.04)", border: "1px solid rgba(139, 92, 246, 0.1)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] uppercase tracking-[0.15em] font-bold" style={{ color: "#a78bfa" }}>Readiness Trend</p>
                <div className="flex gap-1">
                  {["1W","1M","3M","6M"].map((p, i) => (
                    <span key={p} className="text-[9px] px-2 py-0.5 rounded font-medium"
                      style={{
                        background: i === 1 ? "rgba(139, 92, 246, 0.15)" : "rgba(249, 115, 22, 0.08)",
                        color: i === 1 ? "#a78bfa" : "#fb923c",
                      }}>{p}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-[3px] h-24">
                {[35,42,38,48,55,52,61,58,67,72,68,75,71,78,82,79,85,87].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm" style={{
                    height: `${h}%`,
                    background: i >= 15
                      ? "#f97316"
                      : i >= 10
                        ? "#a78bfa"
                        : `rgba(139, 92, 246, ${0.3 + (i / 20) * 0.5})`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Landing Page ───────────────────────────────────────────────────── */

export default function LandingPage() {
  const { signIn, signUp, signInDemo, user } = useAuth();
  const [, navigate] = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const supabaseReady = !supabaseConfigError;

  useEffect(() => { if (user) navigate("/app"); }, [user, navigate]);

  async function handleSignIn(email: string, password: string) {
    if (!supabaseReady) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
    await signIn(email, password); navigate("/app");
  }
  async function handleSignUp(email: string, password: string) {
    if (!supabaseReady) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
    const result = await signUp(email, password);
    if (!result.needsEmailConfirmation) navigate("/app"); return result;
  }
  async function handleDemo() { await signInDemo(); navigate("/app"); }

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: "#080810" }}>
      <AnimatedBackground />

      {/* ─── Header ─────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "#080810", backdropFilter: "blur(20px)" }}
      >
        <div className="section-container h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2">
            <Logo size={26} />
          </a>
          <nav className="hidden md:flex items-center gap-8">
            {["Features","How it works","Pricing","Testimonials"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm font-semibold transition-colors duration-300"
                style={{ color: "rgba(255,255,255,0.5)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
                {item}
              </a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => setShowAuth(true)}
              className="text-sm font-semibold transition-colors duration-200"
              style={{ color: "rgba(255,255,255,0.5)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
              Sign in
            </button>
            <button onClick={() => setShowAuth(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #f97316 100%)",
                color: "#fff",
                boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(249, 115, 22, 0.4)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(139, 92, 246, 0.3)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
              Get started <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
        <div className="section-container relative">
          <div className="max-w-4xl mx-auto text-center mb-16">
            {/* Label */}
            <motion.div {...fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8"
              style={{ borderColor: "rgba(249, 115, 22, 0.25)", background: "#080810" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#f97316" }} />
              <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "#fb923c" }}>
                AI-Powered Developer Intelligence
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 {...fadeUp} className="font-bold mb-8 leading-[1.05] tracking-[-0.03em]"
              style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)", textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
              <span className="text-white">Ship With </span>
              <span style={{ color: "#f97316", textShadow: "0 2px 20px rgba(249,115,22,0.3)" }}>Evidence,</span>
              <br />
              <span className="text-white">Not </span>
              <span style={{ color: "#a78bfa", textShadow: "0 2px 20px rgba(139,92,246,0.3)" }}>Hope.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p {...fadeUp} className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
              style={{ color: "rgba(255,255,255,0.7)", textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>
              Point NOCTRA at your codebase. Get a launch readiness score,
              prioritized blockers, and fix prompts you can paste straight into
              your AI IDE.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div {...fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => setShowAuth(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-sm font-bold transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #8b5cf6 0%, #f97316 100%)",
                  color: "#fff",
                  boxShadow: "0 0 30px rgba(139, 92, 246, 0.25)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(249, 115, 22, 0.35)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(139, 92, 246, 0.25)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                <Play size={16} fill="currentColor" />
                Start Your Free Trial
              </button>
              <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-sm font-bold transition-all duration-300 border"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.03)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(139, 92, 246, 0.4)"; (e.currentTarget as HTMLElement).style.color = "#a78bfa"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}>
                See How It Works
              </button>
            </motion.div>
          </div>
          <DashboardMockup />
        </div>
      </section>

      {/* ─── Trust Bar ──────────────────────────────────────────── */}
      <section className="py-12 border-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="section-container">
          <p className="text-center text-[10px] uppercase tracking-[0.3em] mb-8 font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
            Trusted by forward-thinking builders
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {TRUSTED_BY.map((name) => (
              <span key={name} className="text-sm font-bold transition-colors duration-300"
                style={{ color: "rgba(255,255,255,0.25)" }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ──────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="section-container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#f97316" }}>Impact</p>
            <h2 className="font-bold tracking-[-0.03em] leading-[1.05] mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              <span className="text-white">Numbers That </span>
              <span style={{ color: "#f97316" }}>Speak</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <motion.div key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center p-8 rounded-xl border relative overflow-hidden"
                style={{
                  background: "#080810",
                  borderColor: accentColor(stat.accent, "border"),
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accentColor(stat.accent)}, transparent)` }} />
                <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${accentColor(stat.accent)}, transparent)` }} />
                <p className="text-4xl sm:text-5xl font-bold mb-3 tracking-[-0.03em] leading-none"
                  style={{ color: accentColor(stat.accent) }}>
                  {stat.value}
                </p>
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────── */}
      <section id="features" className="py-24 lg:py-32">
        <div className="section-container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-20">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#f97316" }}>Features</p>
            <h2 className="font-bold tracking-[-0.03em] leading-[1.05] mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              <span className="text-white">Intelligence That </span>
              <span style={{ color: "#f97316" }}>Pays</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              Every feature is designed to move your launch score. No fluff. No vanity metrics. Just evidence.
            </p>
          </motion.div>
          <motion.div {...staggerContainer} className="grid md:grid-cols-2 gap-4">
            {FEATURES.map((feature) => (
              <motion.div key={feature.title} {...staggerItem}
                className="group p-8 rounded-xl border transition-all duration-300 hover:scale-[1.01]"
                style={{
                  background: "#080810",
                  borderColor: accentColor(feature.accent, "border"),
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = accentColor(feature.accent, "hex");
                  (e.currentTarget as HTMLElement).style.background = "#0a0a18";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = accentColor(feature.accent, "border");
                  (e.currentTarget as HTMLElement).style.background = "#080810";
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: accentColor(feature.accent, "bg"), border: `1px solid ${accentColor(feature.accent, "border")}` }}>
                    <feature.icon size={24} strokeWidth={1.5} style={{ color: accentColor(feature.accent) }} />
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ background: accentColor(feature.accent, "bg"), border: `1px solid ${accentColor(feature.accent, "border")}` }}>
                    <span className="text-sm font-bold" style={{ color: accentColor(feature.accent) }}>{feature.metric}</span>
                    <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{feature.metricLabel}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2.5 text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 lg:py-32">
        <div className="section-container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-20">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#f97316" }}>How It Works</p>
            <h2 className="font-bold tracking-[-0.03em] leading-[1.05] mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              <span className="text-white">From Code to </span>
              <span style={{ color: "#f97316" }}>Launch</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              Four steps between you and a confident launch. No guesswork. Just evidence.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="p-6 rounded-xl border"
                style={{ background: "#080810", borderColor: accentColor(step.accent, "border") }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ background: accentColor(step.accent, "bg"), border: `1px solid ${accentColor(step.accent, "border")}`, color: accentColor(step.accent) }}>
                    {step.step}
                  </div>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden md:block flex-1 h-px" style={{ background: `linear-gradient(90deg, ${accentColor(step.accent)}, transparent)` }} />
                  )}
                </div>
                <h3 className="text-lg font-bold mb-3 text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 lg:py-32">
        <div className="section-container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-20">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#f97316" }}>Pricing</p>
            <h2 className="font-bold tracking-[-0.03em] leading-[1.05] mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              <span className="text-white">Invest in Your </span>
              <span style={{ color: "#f97316" }}>Launch</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              Every plan includes a 14-day free trial. No credit card required.
            </p>
          </motion.div>
          <motion.div {...staggerContainer} className="grid md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <motion.div key={plan.name} {...staggerItem}
                className="p-8 rounded-xl border transition-all duration-300 hover:scale-[1.01]"
                style={{
                  background: "#080810",
                  borderColor: plan.popular ? "rgba(249, 115, 22, 0.3)" : "rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = plan.popular ? "#f97316" : "rgba(139,92,246,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = plan.popular ? "rgba(249, 115, 22, 0.3)" : "rgba(255,255,255,0.06)";
                }}
              >
                {plan.popular && (
                  <div className="inline-block text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4"
                    style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316" }}>
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>{plan.description}</p>
                <div className="mb-8">
                  <span className="text-4xl font-bold tracking-[-0.03em]" style={{ color: plan.popular ? "#f97316" : "#fff" }}>{plan.price}</span>
                  <span className="text-sm ml-1" style={{ color: "rgba(255,255,255,0.4)" }}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                      <Check size={16} className="mt-0.5 shrink-0" style={{ color: plan.popular ? "#f97316" : "#8b5cf6" }} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setShowAuth(true)}
                  className="w-full py-3 rounded-lg text-sm font-bold transition-all duration-300"
                  style={{
                    background: plan.popular ? "linear-gradient(135deg, #f97316 0%, #fb923c 100%)" : "rgba(139,92,246,0.08)",
                    color: plan.popular ? "#fff" : "#a78bfa",
                    border: `1px solid ${plan.popular ? "rgba(249,115,22,0.3)" : "rgba(139,92,246,0.2)"}`,
                    boxShadow: plan.popular ? "0 0 20px rgba(249,115,22,0.15)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (plan.popular) {
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(249,115,22,0.25)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                    } else {
                      (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.15)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (plan.popular) {
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(249,115,22,0.15)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    } else {
                      (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.08)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.2)";
                    }
                  }}>
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Testimonials ───────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="section-container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-20">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#f97316" }}>Testimonials</p>
            <h2 className="font-bold tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              <span className="text-white">Loved by </span>
              <span style={{ color: "#f97316" }}>Founders</span>
            </h2>
          </motion.div>

          <motion.div {...staggerContainer} className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.author} {...staggerItem}>
                <div className="p-8 h-full flex flex-col rounded-xl border"
                  style={{ background: "#080810", borderColor: accentColor(t.accent, "border") }}>
                  <div className="flex gap-1.5 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} style={{ color: accentColor(t.accent) }} fill={accentColor(t.accent)} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-8 flex-1" style={{ color: "rgba(255,255,255,0.5)" }}>&ldquo;{t.quote}&rdquo;</p>
                  <div className="pt-6 border-t flex items-center justify-between gap-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: accentColor(t.accent, "bg"), border: `1px solid ${accentColor(t.accent, "border")}`, color: accentColor(t.accent) }}>
                        {t.author.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{t.author}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{t.role}</p>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0"
                      style={{ background: accentColor(t.accent, "bg"), border: `1px solid ${accentColor(t.accent, "border")}` }}>
                      <span className="text-sm font-bold" style={{ color: accentColor(t.accent) }}>{t.metric}</span>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>{t.metricLabel}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="section-container max-w-3xl text-center">
          <motion.div {...fadeUp} className="p-12 lg:p-16 rounded-2xl border"
            style={{
              background: "#080810",
              borderColor: "rgba(139, 92, 246, 0.2)",
              boxShadow: "0 0 60px rgba(139, 92, 246, 0.08)",
            }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #f97316, #8b5cf6, transparent)" }} />
            <h2 className="font-bold mb-7 tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              <span className="text-white">Stop Guessing.</span>
              <br />
              <span style={{ color: "#f97316" }}>Start </span>
              <span style={{ color: "#a78bfa" }}>Shipping.</span>
            </h2>
            <p className="text-lg mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              Join 1,200+ builders who catch launch blockers before they ship — with evidence, not hope.
            </p>
            <button onClick={() => setShowAuth(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-sm font-bold transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #f97316 100%)",
                color: "#fff",
                boxShadow: "0 0 40px rgba(139, 92, 246, 0.25)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 60px rgba(249, 115, 22, 0.3)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.02)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(139, 92, 246, 0.25)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)"; }}>
              Start Your 14-Day Free Trial
              <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t py-16" style={{ borderColor: "rgba(255,255,255,0.05)", background: "#080810" }}>
        <div className="section-container max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <LogoMark size={22} />
                <span className="font-bold text-lg tracking-tight text-white">NOCTRA</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                The observatory for shipping. Know your launch readiness before you push to prod.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: "#f97316" }}>Product</h4>
              <ul className="space-y-3">
                {["Features","Pricing","Integrations","Changelog"].map((item) => (
                  <li key={item}>
                    <span className="text-sm transition-colors duration-300 cursor-default font-medium"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#a78bfa"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: "#8b5cf6" }}>Company</h4>
              <ul className="space-y-3">
                {["About","Blog","Careers","Contact"].map((item) => (
                  <li key={item}>
                    <span className="text-sm transition-colors duration-300 cursor-default font-medium"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#a78bfa"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: "#f97316" }}>Legal</h4>
              <ul className="space-y-3">
                {["Privacy","Terms","Security"].map((item) => (
                  <li key={item}>
                    <span className="text-sm transition-colors duration-300 cursor-default font-medium"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#a78bfa"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>© 2026 NOCTRA. All rights reserved.</p>
            <p className="text-xs font-bold" style={{ color: "#f97316" }}>Ship with evidence.</p>
          </div>
        </div>
      </footer>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onSignIn={handleSignIn} onSignUp={handleSignUp} onDemo={handleDemo} />
    </div>
  );
}
