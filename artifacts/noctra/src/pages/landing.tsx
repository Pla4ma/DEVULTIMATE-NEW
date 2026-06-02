import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { supabaseConfigError } from "@/integrations/supabase/client";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Play, Star, Stethoscope, Brain, Zap, TrendingUp,
  Check, ArrowRight, BarChart3, Layers, Database,
  BrainCircuit, Lock, Gauge, CheckCircle, XCircle,
  ArrowUpRight, Code2, Target, Wrench, Scan, RotateCcw,
  Shield, RefreshCw, ChevronRight,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { AuthModal } from "./landing/AuthModal";

/* ─── Data ───────────────────────────────────────────────────────────── */

const TRUSTED_BY = ["Stripe","Vercel","Linear","Notion","Figma","Raycast","Supabase","GitHub"];

const STATS = [
  { value: "94%", label: "Blocker Detection" },
  { value: "$2.4M", label: "Revenue Saved" },
  { value: "1,200+", label: "Active Teams" },
  { value: "32%", label: "Churn Reduction" },
];

const FEATURES = [
  { icon: BrainCircuit, title: "AI Launch Readiness Scoring",
    description: "Analyze 50+ data points across your codebase to predict launch blockers with 94% accuracy.",
    metric: "94%", metricLabel: "accuracy" },
  { icon: BarChart3, title: "Codebase Intelligence",
    description: "Predict your next 6 months of technical debt before it becomes an emergency that costs users.",
    metric: "6mo", metricLabel: "forecast" },
  { icon: Layers, title: "Predictive Build Analytics",
    description: "Know which features will ship over budget. AI monitors project health and scope creep in real time.",
    metric: "实时", metricLabel: "monitoring" },
  { icon: Zap, title: "AI-Generated Fix Prompts",
    description: "Get specific, actionable prompts you can paste into Cursor or Copilot to resolve blockers immediately.",
    metric: "<2min", metricLabel: "to fix" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Connect Your Code",
    description: "Import your repo via ZIP or GitHub. Our engine analyzes structure, dependencies, security posture, and code quality." },
  { step: "02", title: "AI Analyzes Patterns",
    description: "Our AI engine processes your codebase, identifies anti-patterns, and scores launch readiness based on real-world shipping data." },
  { step: "03", title: "Get Actionable Insights",
    description: "Receive AI-generated insights with file-level evidence. Know exactly what needs attention, why, and how to fix it." },
  { step: "04", title: "Ship With Confidence",
    description: "Track improvements with every rescan. Watch your launch score climb as blockers resolve, and ship when you hit green." },
];

const PLANS = [
  { name: "Starter", price: "$99", period: "/month", description: "For solo consultants & small agencies",
    features: ["Up to 25 clients","Basic health scoring","Revenue tracking","3 AI insights/month","Email support"],
    cta: "Start Free Trial", popular: false },
  { name: "Professional", price: "$249", period: "/month", description: "For growing firms with 10-50 clients",
    features: ["Unlimited clients","Advanced AI health scoring","Revenue forecasting","Unlimited AI insights","Predictive churn analytics","Priority support","Team collaboration"],
    cta: "Start Free Trial", popular: true },
  { name: "Enterprise", price: "$499", period: "/month", description: "For established firms with 50+ clients",
    features: ["Everything in Professional","Custom AI model training","API access","White-label reports","Dedicated success manager","SSO & advanced security","Custom integrations"],
    cta: "Contact Sales", popular: false },
];

const TESTIMONIALS = [
  { quote: "NOCTRA predicted that our largest client was about to churn. We acted on the AI's recommendation and not only saved them but expanded the contract by 40%.",
    author: "Sarah Chen", role: "CEO, Meridian Consulting", metric: "95%", metricLabel: "forecast accuracy" },
  { quote: "The revenue forecasting is scary accurate. We stuck to the plan for 4 months straight. We've completely changed how we plan hiring and resource allocation.",
    author: "Marcus Johnson", role: "Partner, Johnson & Associates", metric: "3X", metricLabel: "revenue increase" },
  { quote: "We reduced client churn by 38% in the first quarter. The AI insights feel like having a Chief Client Officer who never sleeps.",
    author: "Elena Rodriguez", role: "Managing Director, Focus Agency", metric: "38%", metricLabel: "churn reduction" },
];

/* ─── Animations ──────────────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true, margin: "-80px" },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
  viewport: { once: true },
};

/* ─── Dashboard Mockup ───────────────────────────────────────────────── */

function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
      className="relative w-full max-w-5xl mx-auto"
    >
      <div className="rounded-2xl overflow-hidden relative"
        style={{
          background: "linear-gradient(180deg, #13132a 0%, #0a0a0f 100%)",
          border: "1px solid rgba(139, 92, 246, 0.15)",
          boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8), 0 0 60px -20px rgba(139,92,246,0.1)",
        }}>
        {/* Window chrome */}
        <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#eab308" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#6e6e8a" }}>
              <Lock size={10} /><span>app.noctra.dev</span>
            </div>
          </div>
          <div className="w-16" />
        </div>

        <div className="p-5 grid grid-cols-12 gap-3">
          {/* Sidebar */}
          <div className="col-span-2 space-y-1.5">
            {[{ icon: Gauge, label: "Dashboard", active: true },
              { icon: Stethoscope, label: "Health", active: false },
              { icon: Brain, label: "Brain", active: false },
              { icon: BarChart3, label: "Analytics", active: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]"
                style={{
                  background: item.active ? "rgba(139, 92, 246, 0.08)" : "transparent",
                  color: item.active ? "#a78bfa" : "#6e6e8a",
                  border: item.active ? "1px solid rgba(139, 92, 246, 0.15)" : "1px solid transparent",
                }}>
                <item.icon size={13} strokeWidth={item.active ? 2 : 1.5} />
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Main area */}
          <div className="col-span-10 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[{ label: "Launch Score", value: "87", color: "#8b5cf6", width: "87%" },
                { label: "Blockers", value: "3", color: "#ef4444", width: "30%" },
                { label: "Health Trend", value: "+12%", color: "#22c55e", width: "65%" },
              ].map((card) => (
                <div key={card.label} className="rounded-xl p-3.5"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <p className="text-[9px] uppercase tracking-[0.15em] mb-2" style={{ color: "#6e6e8a" }}>{card.label}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
                    <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="h-full rounded-full" style={{ width: card.width, background: card.color, opacity: 0.6 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] uppercase tracking-[0.15em]" style={{ color: "#6e6e8a" }}>Readiness Trend</p>
                <div className="flex gap-1">
                  {["1W","1M","3M","6M"].map((p, i) => (
                    <span key={p} className="text-[9px] px-2 py-0.5 rounded"
                      style={{ background: i === 1 ? "rgba(139, 92, 246, 0.1)" : "transparent", color: i === 1 ? "#a78bfa" : "#6e6e8a" }}>{p}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-[2px] h-24">
                {[35,42,38,48,55,52,61,58,67,72,68,75,71,78,82,79,85,87].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm" style={{
                    height: `${h}%`,
                    background: i >= 15 ? "#8b5cf6" : `rgba(139, 92, 246, ${0.1 + (i / 20) * 0.3})`,
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

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 80]);

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
    <div className="min-h-screen bg-void-0 text-text-primary overflow-x-hidden">
      {/* ═════════ CONSISTENT BACKGROUND — smooth, no dark patches ═════════ */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Smooth dark base */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 30%, #13132a 60%, #0a0a0f 100%)",
        }} />
        {/* Consistent dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(139, 92, 246, 0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Very subtle top glow */}
        <div className="absolute inset-x-0 top-0 h-[500px] opacity-30 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ═════════ HEADER ═════════ */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl"
        style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(10, 10, 15, 0.8)" }}
      >
        <div className="section-container h-16 flex items-center justify-between">
          <Logo size={26} />
          <nav className="hidden md:flex items-center gap-8">
            {["Features","How It Works","Pricing"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm transition-colors duration-300 relative group"
                style={{ color: "#6e6e8a" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f8f7ff"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#6e6e8a"; }}>
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-accent-light group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowAuth(true)}
              className="text-sm px-4 py-2 rounded-lg transition-all duration-300"
              style={{ color: "#6e6e8a" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f8f7ff"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#6e6e8a"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              Sign in
            </button>
            <button onClick={() => setShowAuth(true)}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
                color: "#0a0a0f",
                boxShadow: "0 0 20px rgba(139, 92, 246, 0.25)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(139, 92, 246, 0.4)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(139, 92, 246, 0.25)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
              Get Started
            </button>
          </div>
        </div>
      </motion.header>

      {/* ═════════ HERO ═════════ */}
      <motion.section className="relative pt-36 pb-20 lg:pt-44 lg:pb-28 overflow-hidden" style={{ y: heroY }}>
        <div className="section-container relative">
          <div className="max-w-4xl mx-auto text-center mb-16">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8"
              style={{ borderColor: "rgba(139, 92, 246, 0.2)", background: "rgba(139, 92, 246, 0.04)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ background: "#a78bfa", boxShadow: "0 0 6px rgba(167,139,250,0.5)" }} />
              <span className="text-[11px] font-medium tracking-wide" style={{ color: "#a78bfa" }}>
                AI-Powered Developer Intelligence
              </span>
            </motion.div>

            {/* Headline — clean, no scramble, just gradient */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-bold mb-8 leading-[1.05] tracking-[-0.03em]"
              style={{ fontSize: "clamp(3rem, 7vw, 6rem)", color: "#f8f7ff" }}
            >
              Ship With{" "}
              <span className="text-gradient">Evidence,</span>
              <br />
              Not Hope.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
              style={{ color: "#a1a1b8" }}
            >
              Point NOCTRA at your codebase. Get a launch readiness score,
              prioritized blockers, and fix prompts you can paste straight into
              your AI IDE.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button onClick={() => setShowAuth(true)}
                className="group relative inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold transition-all duration-300 overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
                  color: "#0a0a0f",
                  boxShadow: "0 0 40px rgba(139, 92, 246, 0.25)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 60px rgba(139, 92, 246, 0.4)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(139, 92, 246, 0.25)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                <Play size={16} fill="currentColor" />
                Start Your Free Trial
              </button>
              <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-medium transition-all duration-300 border"
                style={{ borderColor: "rgba(255,255,255,0.08)", color: "#f8f7ff", background: "rgba(255,255,255,0.02)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(139, 92, 246, 0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(139, 92, 246, 0.04)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}>
                See How It Works
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>

          <DashboardMockup />
        </div>
      </motion.section>

      {/* ═════════ TRUSTED BY ═════════ */}
      <section className="py-16 border-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <div className="section-container">
          <p className="text-center text-[10px] uppercase tracking-[0.3em] mb-8" style={{ color: "#4a4a60" }}>
            Trusted by forward-thinking builders
          </p>
          <div className="flex items-center justify-center gap-14 flex-wrap">
            {TRUSTED_BY.map((name) => (
              <span key={name} className="text-sm font-medium transition-colors duration-300 cursor-default"
                style={{ color: "#4a4a60" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#a1a1b8"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4a4a60"; }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ STATS ═════════ */}
      <section className="py-28 lg:py-32">
        <div className="section-container max-w-5xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
            {STATS.map((stat, i) => (
              <motion.div key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-5xl sm:text-6xl font-bold mb-2 tracking-[-0.03em] text-gradient leading-none">
                  {stat.value}
                </p>
                <p className="text-sm" style={{ color: "#6e6e8a" }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ FEATURES ═════════ */}
      <section id="features" className="py-28 lg:py-32">
        <div className="section-container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-20">
            <p className="eyebrow mb-5">Features</p>
            <h2 className="font-bold mb-6 tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", color: "#f8f7ff" }}>
              Intelligence That
              <br /><span className="text-gradient">Pays for Itself</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#6e6e8a" }}>
              Every feature designed to help you ship faster, catch blockers earlier, and launch with confidence.
            </p>
          </motion.div>

          <motion.div {...staggerContainer} className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map((feature) => (
              <motion.div key={feature.title} {...staggerItem}>
                <div className="card-glass edge-highlight p-7 h-full group">
                  <div className="w-full h-44 rounded-xl mb-6 overflow-hidden relative"
                    style={{
                      background: "linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(19,19,42,0.3) 100%)",
                      border: "1px solid rgba(255,255,255,0.03)",
                    }}>
                    <div className="absolute inset-0 opacity-20" style={{
                      backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.3) 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                        style={{
                          background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(167,139,250,0.06) 100%)",
                          border: "1px solid rgba(139,92,246,0.15)",
                          boxShadow: "0 0 20px rgba(139,92,246,0.1)",
                        }}>
                        <feature.icon size={28} strokeWidth={1.5} style={{ color: "#a78bfa" }} />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.12)" }}>
                      <span className="text-sm font-bold" style={{ color: "#a78bfa" }}>{feature.metric}</span>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(167,139,250,0.5)" }}>{feature.metricLabel}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2.5" style={{ color: "#f8f7ff" }}>{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#a1a1b8" }}>{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═════════ HOW IT WORKS ═════════ */}
      <section id="how-it-works" className="py-28 lg:py-32" style={{ background: "rgba(139, 92, 246, 0.01)" }}>
        <div className="section-container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-20">
            <p className="eyebrow mb-5">How It Works</p>
            <h2 className="font-bold mb-6 tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", color: "#f8f7ff" }}>
              From Code to
              <br /><span className="text-gradient">Launch</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#6e6e8a" }}>
              Four steps to shipping with confidence. No guesswork, no blind spots — just evidence.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                <div className="text-6xl font-bold mb-5 tracking-tighter leading-none text-gradient opacity-40">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: "#f8f7ff" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#a1a1b8" }}>{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ PRICING ═════════ */}
      <section id="pricing" className="py-28 lg:py-32">
        <div className="section-container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-20">
            <p className="eyebrow mb-5">Pricing</p>
            <h2 className="font-bold mb-6 tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", color: "#f8f7ff" }}>
              Invest in
              <br /><span className="text-gradient">Launch Readiness</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#6e6e8a" }}>
              Start free, scale as you ship more. Every plan includes our core AI analysis engine.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((plan, i) => (
              <motion.div key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative"
              >
                {plan.popular ? (
                  <div className="card-glass-popular p-8 h-full">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-[10px] font-semibold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full"
                        style={{
                          background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
                          color: "#0a0a0f",
                          boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
                        }}>
                        Most Popular
                      </span>
                    </div>
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-2" style={{ color: "#f8f7ff" }}>{plan.name}</h3>
                      <p className="text-sm" style={{ color: "#a1a1b8" }}>{plan.description}</p>
                    </div>
                    <div className="mb-8">
                      <span className="text-4xl font-bold tracking-[-0.03em]" style={{ color: "#f8f7ff" }}>{plan.price}</span>
                      <span className="text-sm ml-1" style={{ color: "#6e6e8a" }}>{plan.period}</span>
                    </div>
                    <ul className="space-y-4 mb-10">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm" style={{ color: "#a1a1b8" }}>
                          <Check size={16} className="mt-0.5 shrink-0" style={{ color: "#a78bfa" }} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => setShowAuth(true)}
                      className="w-full text-sm font-semibold py-3 rounded-xl transition-all duration-300 hover:brightness-110"
                      style={{
                        background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
                        color: "#0a0a0f",
                        boxShadow: "0 0 20px rgba(139, 92, 246, 0.2)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(139, 92, 246, 0.35)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(139, 92, 246, 0.2)"; }}>
                      {plan.cta}
                    </button>
                  </div>
                ) : (
                  <div className="card-glass p-8 h-full">
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-2" style={{ color: "#f8f7ff" }}>{plan.name}</h3>
                      <p className="text-sm" style={{ color: "#a1a1b8" }}>{plan.description}</p>
                    </div>
                    <div className="mb-8">
                      <span className="text-4xl font-bold tracking-[-0.03em]" style={{ color: "#f8f7ff" }}>{plan.price}</span>
                      <span className="text-sm ml-1" style={{ color: "#6e6e8a" }}>{plan.period}</span>
                    </div>
                    <ul className="space-y-4 mb-10">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm" style={{ color: "#a1a1b8" }}>
                          <Check size={16} className="mt-0.5 shrink-0" style={{ color: "#6e6e8a" }} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => setShowAuth(true)}
                      className="w-full text-sm font-medium py-3 rounded-xl transition-all duration-300 border"
                      style={{ borderColor: "rgba(255,255,255,0.08)", color: "#f8f7ff", background: "rgba(255,255,255,0.02)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(139, 92, 246, 0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(139, 92, 246, 0.04)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}>
                      {plan.cta}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ TESTIMONIALS ═════════ */}
      <section className="py-28 lg:py-32" style={{ background: "rgba(139, 92, 246, 0.01)" }}>
        <div className="section-container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-20">
            <h2 className="font-bold tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", color: "#f8f7ff" }}>
              Loved by
              <br /><span className="text-gradient">Founders</span>
            </h2>
          </motion.div>

          <motion.div {...staggerContainer} className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.author} {...staggerItem}>
                <div className="card-glass edge-highlight p-8 h-full flex flex-col">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} style={{ color: "#a78bfa" }} fill="#a78bfa" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-8 flex-1" style={{ color: "#a1a1b8" }}>"{t.quote}"</p>
                  <div className="pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <p className="text-sm font-semibold" style={{ color: "#f8f7ff" }}>{t.author}</p>
                    <p className="text-xs mb-4" style={{ color: "#6e6e8a" }}>{t.role}</p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(139, 92, 246, 0.06)", border: "1px solid rgba(139, 92, 246, 0.1)" }}>
                      <span className="text-sm font-bold" style={{ color: "#a78bfa" }}>{t.metric}</span>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(167,139,250,0.5)" }}>{t.metricLabel}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═════════ FINAL CTA ═════════ */}
      <section className="py-32 lg:py-36 relative overflow-hidden">
        <div className="absolute inset-0 -z-10"
          style={{ background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 70%)" }} />
        <div className="section-container max-w-3xl text-center relative">
          <motion.div {...fadeUp}>
            <h2 className="font-bold mb-7 tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", color: "#f8f7ff" }}>
              Stop Guessing.
              <br /><span className="text-gradient">Start Shipping.</span>
            </h2>
            <p className="text-lg mb-12 max-w-xl mx-auto leading-relaxed" style={{ color: "#a1a1b8" }}>
              Join 1,200+ builders who catch launch blockers before they ship — with evidence, not hope.
            </p>
            <button onClick={() => setShowAuth(true)}
              className="group relative inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-sm font-semibold transition-all duration-300 overflow-hidden animate-glow"
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
                color: "#0a0a0f",
                boxShadow: "0 0 40px rgba(139, 92, 246, 0.3)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 60px rgba(139, 92, 246, 0.5)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(139, 92, 246, 0.3)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
              Start Your 14-Day Free Trial
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═════════ FOOTER ═════════ */}
      <footer className="border-t py-16" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.005)" }}>
        <div className="section-container max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <LogoMark size={22} />
                <span className="font-semibold text-lg tracking-tight" style={{ color: "#f8f7ff" }}>NOCTRA</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#6e6e8a" }}>
                The observatory for shipping. Know your launch readiness before you push to prod.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4" style={{ color: "#f8f7ff" }}>Product</h4>
              <ul className="space-y-3">
                {["Features","Pricing","Integrations","Changelog"].map((item) => (
                  <li key={item}>
                    <span className="text-sm transition-colors duration-300 cursor-default relative group inline-block"
                      style={{ color: "#6e6e8a" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f8f7ff"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#6e6e8a"; }}>
                      {item}
                      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-accent-light group-hover:w-full transition-all duration-300" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4" style={{ color: "#f8f7ff" }}>Company</h4>
              <ul className="space-y-3">
                {["About","Blog","Careers","Contact"].map((item) => (
                  <li key={item}>
                    <span className="text-sm transition-colors duration-300 cursor-default relative group inline-block"
                      style={{ color: "#6e6e8a" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f8f7ff"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#6e6e8a"; }}>
                      {item}
                      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-accent-light group-hover:w-full transition-all duration-300" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4" style={{ color: "#f8f7ff" }}>Legal</h4>
              <ul className="space-y-3">
                {["Privacy","Terms","Security"].map((item) => (
                  <li key={item}>
                    <span className="text-sm transition-colors duration-300 cursor-default relative group inline-block"
                      style={{ color: "#6e6e8a" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f8f7ff"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#6e6e8a"; }}>
                      {item}
                      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-accent-light group-hover:w-full transition-all duration-300" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <p className="text-xs" style={{ color: "#4a4a60" }}>© 2026 NOCTRA. All rights reserved.</p>
            <p className="text-xs" style={{ color: "#4a4a60" }}>Ship with evidence.</p>
          </div>
        </div>
      </footer>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onSignIn={handleSignIn} onSignUp={handleSignUp} onDemo={handleDemo} />
    </div>
  );
}
