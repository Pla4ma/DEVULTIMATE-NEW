import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { supabaseConfigError } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Play,
  Star,
  Stethoscope,
  Target,
  CheckSquare,
  RotateCcw,
  Brain,
  Rocket,
  Zap,
  TrendingUp,
  Shield,
  Scan,
  Wrench,
  Check,
  ArrowRight,
  BarChart3,
  Lightbulb,
  Code2,
  Search,
  Layers,
  Database,
  BrainCircuit,
  Globe,
  Lock,
  Users,
  ChevronRight,
  Minus,
  Sparkles,
  GitBranch,
  Terminal,
  ShieldCheck,
  Gauge,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { ObsidianButton } from "@/components/ObsidianButton";
import { AuthModal } from "./landing/AuthModal";

/* ─── Data ───────────────────────────────────────────────────────────── */

const TRUSTED_BY = ["Stripe", "Vercel", "Linear", "Notion", "Figma", "Raycast"];

const STATS = [
  { value: "94%", label: "Blocker Detection" },
  { value: "$2.4M", label: "Revenue Saved" },
  { value: "1,200+", label: "Active Teams" },
  { value: "32%", label: "Churn Reduction" },
];

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "AI Launch Readiness Scoring",
    description:
      "Our proprietary AI analyzes 50+ data points across your codebase to predict launch blockers with 94% accuracy. Never ship broken code unexpectedly.",
    metric: "94%",
    metricLabel: "accuracy",
  },
  {
    icon: BarChart3,
    title: "Codebase Intelligence",
    description:
      "AI-powered analysis that predicts your next 6 months of technical debt. Fix issues before they become emergencies that cost you users.",
    metric: "6mo",
    metricLabel: "forecast",
  },
  {
    icon: Layers,
    title: "Predictive Build Analytics",
    description:
      "Know which features will ship over budget before they do. AI monitors project health, scope creep, and velocity in real time.",
    metric: "实时",
    metricLabel: "monitoring",
  },
  {
    icon: Zap,
    title: "AI-Generated Fix Prompts",
    description:
      "Don't just see problems — get specific, actionable prompts you can paste into Cursor or Copilot to resolve blockers immediately.",
    metric: "<2min",
    metricLabel: "to fix",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Connect Your Code",
    description:
      "Import your repo via ZIP or GitHub. Our engine analyzes structure, dependencies, security posture, and code quality in seconds.",
  },
  {
    step: "02",
    title: "AI Analyzes Patterns",
    description:
      "Our AI engine processes your codebase, identifies anti-patterns, and scores launch readiness based on real-world shipping data.",
  },
  {
    step: "03",
    title: "Get Actionable Insights",
    description:
      "Receive AI-generated insights with file-level evidence. Know exactly what needs attention, why it matters, and how to fix it.",
  },
  {
    step: "04",
    title: "Ship With Confidence",
    description:
      "Track improvements with every rescan. Watch your launch score climb as blockers resolve, and ship when you hit green.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$99",
    period: "/month",
    description: "For solo consultants & small agencies",
    features: [
      "Up to 25 clients",
      "Basic health scoring",
      "Revenue tracking",
      "3 AI insights/month",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "$249",
    period: "/month",
    description: "For growing firms with 10-50 clients",
    features: [
      "Unlimited clients",
      "Advanced AI health scoring",
      "Revenue forecasting",
      "Unlimited AI insights",
      "Predictive churn analytics",
      "Priority support",
      "Team collaboration",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$499",
    period: "/month",
    description: "For established firms with 50+ clients",
    features: [
      "Everything in Professional",
      "Custom AI model training",
      "API access",
      "White-label reports",
      "Dedicated success manager",
      "SSO & advanced security",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "NOCTRA predicted that our largest client was about to churn. We acted on the AI's recommendation and not only saved them but expanded the contract by 40%.",
    author: "Sarah Chen",
    role: "CEO, Meridian Consulting",
    metric: "95%",
    metricLabel: "forecast accuracy",
  },
  {
    quote:
      "The revenue forecasting is scary accurate. We stuck to the plan for 4 months straight. We've completely changed how we plan hiring and resource allocation.",
    author: "Marcus Johnson",
    role: "Partner, Johnson & Associates",
    metric: "3X",
    metricLabel: "revenue increase",
  },
  {
    quote:
      "We reduced client churn by 38% in the first quarter. The AI insights feel like having a Chief Client Officer who never sleeps, constantly monitoring every relationship.",
    author: "Elena Rodriguez",
    role: "Managing Director, Focus Agency",
    metric: "38%",
    metricLabel: "churn reduction",
  },
];

/* ─── Animation Helpers ──────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: { staggerChildren: 0.1 },
  },
  viewport: { once: true, margin: "-100px" },
};

const staggerItem = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  viewport: { once: true },
};

/* ─── Premium Dashboard Mockup ───────────────────────────────────────── */

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Ambient glow */}
      <div
        className="absolute -inset-20 -z-10 opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 60%, rgba(13,148,136,0.3) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl border overflow-hidden"
        style={{
          background: "#080c14",
          borderColor: "rgba(255,255,255,0.06)",
          boxShadow:
            "0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Window chrome */}
        <div
          className="flex items-center gap-3 px-5 py-3 border-b"
          style={{ borderColor: "rgba(255,255,255,0.04)" }}
        >
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#eab308" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
          </div>
          <div className="flex-1 flex justify-center">
            <div
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.04)",
                color: "#5c6270",
              }}
            >
              <Lock size={10} />
              <span>app.noctra.dev</span>
            </div>
          </div>
          <div className="w-16" />
        </div>

        {/* App content */}
        <div className="p-6 grid grid-cols-12 gap-4">
          {/* Sidebar */}
          <div className="col-span-2 space-y-3">
            {[
              { icon: Gauge, label: "Dashboard", active: true },
              { icon: Stethoscope, label: "Health", active: false },
              { icon: Brain, label: "Brain", active: false },
              { icon: BarChart3, label: "Analytics", active: false },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs"
                style={{
                  background: item.active
                    ? "rgba(13,148,136,0.08)"
                    : "transparent",
                  color: item.active ? "#0d9488" : "#5c6270",
                  border: item.active
                    ? "1px solid rgba(13,148,136,0.15)"
                    : "1px solid transparent",
                }}
              >
                <item.icon size={14} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Main area */}
          <div className="col-span-10 space-y-4">
            {/* Top row — 3 metric cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Launch Score", value: "87", color: "#0d9488", width: "87%" },
                { label: "Blockers", value: "3", color: "#ef4444", width: "30%", sub: "critical" },
                { label: "Health Trend", value: "+12%", color: "#22c55e", width: "65%", sub: "vs last week" },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5c6270" }}>
                    {card.label}
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: card.color }}>
                        {card.value}
                      </p>
                      {card.sub && (
                        <p className="text-[10px] mt-0.5" style={{ color: "#5c6270" }}>
                          {card.sub}
                        </p>
                      )}
                    </div>
                    <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="h-full rounded-full" style={{ width: card.width, background: card.color, opacity: 0.6 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Middle — chart area */}
            <div
              className="rounded-xl p-5"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5c6270" }}>
                  Readiness Trend
                </p>
                <div className="flex gap-1">
                  {["1W", "1M", "3M", "6M"].map((p, i) => (
                    <span
                      key={p}
                      className="text-[10px] px-2 py-0.5 rounded"
                      style={{
                        background: i === 1 ? "rgba(13,148,136,0.1)" : "transparent",
                        color: i === 1 ? "#0d9488" : "#5c6270",
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-[3px] h-28">
                {[35, 42, 38, 48, 55, 52, 61, 58, 67, 72, 68, 75, 71, 78, 82, 79, 85, 87].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm transition-all"
                      style={{
                        height: `${h}%`,
                        background:
                          i >= 15
                            ? "#0d9488"
                            : `rgba(13,148,136,${0.1 + (i / 20) * 0.25})`,
                      }}
                    />
                  )
                )}
              </div>
              <div className="flex justify-between mt-3">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
                  <span key={m} className="text-[10px]" style={{ color: "#3a4050" }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom — task list */}
            <div className="grid grid-cols-2 gap-4">
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5c6270" }}>
                  Top Blockers
                </p>
                {[
                  { text: "Hardcoded API keys in config.js", type: "critical" },
                  { text: "Missing rate limiting on /api/*", type: "high" },
                  { text: "No error handling in auth flow", type: "medium" },
                ].map((task, i) => (
                  <div key={i} className="flex items-center gap-2 py-2" style={{ borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{
                        background:
                          task.type === "critical"
                            ? "#ef4444"
                            : task.type === "high"
                            ? "#eab308"
                            : "#0d9488",
                      }}
                    />
                    <span className="text-[11px] truncate" style={{ color: "#8a8f9d" }}>
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5c6270" }}>
                  Recent Activity
                </p>
                {[
                  { text: "Scan completed — 12 issues found", time: "2m ago" },
                  { text: "Blocker resolved — auth flow", time: "1h ago" },
                  { text: "Score improved 34 → 89", time: "3h ago" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                    <span className="text-[11px] truncate" style={{ color: "#8a8f9d" }}>
                      {item.text}
                    </span>
                    <span className="text-[10px] shrink-0" style={{ color: "#3a4050" }}>
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Landing Page ───────────────────────────────────────────────────── */

export default function LandingPage() {
  const { signIn, signUp, signInDemo, user } = useAuth();
  const [, navigate] = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const supabaseReady = !supabaseConfigError;

  useEffect(() => {
    if (user) navigate("/app");
  }, [user, navigate]);

  async function handleSignIn(email: string, password: string) {
    if (!supabaseReady)
      throw new Error(supabaseConfigError ?? "Supabase is not configured.");
    await signIn(email, password);
    navigate("/app");
  }

  async function handleSignUp(email: string, password: string) {
    if (!supabaseReady)
      throw new Error(supabaseConfigError ?? "Supabase is not configured.");
    const result = await signUp(email, password);
    if (!result.needsEmailConfirmation) navigate("/app");
    return result;
  }

  async function handleDemo() {
    await signInDemo();
    navigate("/app");
  }

  return (
    <div className="min-h-screen bg-obsidian-0 text-text-primary overflow-x-hidden selection:bg-teal/20">
      {/* Subtle atmospheric background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(13,148,136,0.04) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='none'/%3E%3Cpath d='M0 50h100M50 0v100' stroke='%23fff' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* ─── Header ──────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl"
        style={{
          borderColor: "rgba(255,255,255,0.04)",
          background: "rgba(2,4,10,0.7)",
        }}
      >
        <div className="section-container h-16 flex items-center justify-between">
          <Logo size={26} />

          <nav className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm transition-colors duration-200"
                style={{ color: "#5c6270" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#8a8f9d")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#5c6270")}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ObsidianButton
              variant="ghost"
              size="sm"
              onClick={() => setShowAuth(true)}
            >
              Sign in
            </ObsidianButton>
            <ObsidianButton
              variant="primary"
              size="sm"
              onClick={() => setShowAuth(true)}
            >
              Get Started
            </ObsidianButton>
          </div>
        </div>
      </header>

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-20 lg:pt-48 lg:pb-28">
        <div className="section-container">
          <div className="max-w-4xl mx-auto text-center mb-20">
            {/* Eyebrow — refined */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border mb-10"
              style={{
                borderColor: "rgba(13,148,136,0.15)",
                background: "rgba(13,148,136,0.04)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse-subtle" />
              <span className="text-[11px] font-medium tracking-wide" style={{ color: "#0d9488" }}>
                AI-Powered Developer Intelligence
              </span>
            </motion.div>

            {/* Headline — massive, tight, white */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-bold text-white mb-8"
              style={{
                fontSize: "clamp(3rem, 7vw, 6rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              Ship With Evidence,
              <br />
              Not Hope.
            </motion.h1>

            {/* Subtitle — refined, muted */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg max-w-2xl mx-auto mb-12 leading-relaxed"
              style={{ color: "#5c6270" }}
            >
              Point NOCTRA at your codebase. Get a launch readiness score,
              prioritized blockers, and fix prompts you can paste straight into
              your AI IDE.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <ObsidianButton
                variant="primary"
                size="lg"
                onClick={() => setShowAuth(true)}
                className="gap-2"
              >
                <Play size={16} fill="currentColor" />
                Start Your Free Trial
              </ObsidianButton>
              <ObsidianButton
                variant="secondary"
                size="lg"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                See How It Works
              </ObsidianButton>
            </motion.div>
          </div>

          {/* Dashboard Mockup */}
          <DashboardMockup />
        </div>
      </section>

      {/* ─── Trusted By ───────────────────────────────────────────────── */}
      <section className="py-16 border-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <div className="section-container">
          <p className="text-center text-[11px] uppercase tracking-[0.2em] mb-10" style={{ color: "#3a4050" }}>
            Trusted by forward-thinking builders
          </p>
          <div className="flex items-center justify-center gap-14 flex-wrap">
            {TRUSTED_BY.map((name) => (
              <span
                key={name}
                className="text-sm font-medium transition-colors duration-300 cursor-default"
                style={{ color: "#3a4050" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#5c6270")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#3a4050")}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ───────────────────────────────────────────────────── */}
      <section className="py-28 lg:py-36">
        <div className="section-container max-w-5xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <p
                  className="text-5xl sm:text-6xl font-bold mb-3 tracking-tight"
                  style={{ color: "#0d9488", lineHeight: 1 }}
                >
                  {stat.value}
                </p>
                <p className="text-sm" style={{ color: "#5c6270" }}>
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────── */}
      <section id="features" className="py-28 lg:py-36">
        <div className="section-container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-24">
            <p className="eyebrow mb-5">Features</p>
            <h2
              className="font-bold text-white mb-6"
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Intelligence That Pays for Itself
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#5c6270" }}>
              Every feature designed to help you ship faster, catch blockers
              earlier, and launch with confidence — every single time.
            </p>
          </motion.div>

          <motion.div
            {...staggerContainer}
            className="grid sm:grid-cols-2 gap-5"
          >
            {FEATURES.map((feature) => (
              <motion.div key={feature.title} {...staggerItem}>
                <div className="card-premium p-7 h-full group">
                  {/* Image area */}
                  <div
                    className="w-full h-48 rounded-xl mb-7 overflow-hidden relative"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(13,148,136,0.04) 0%, rgba(13,24,37,0.3) 100%)",
                      border: "1px solid rgba(255,255,255,0.03)",
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <feature.icon
                        size={44}
                        strokeWidth={1}
                        className="transition-all duration-500"
                        style={{ color: "rgba(13,148,136,0.25)" }}
                        onMouseEnter={(e) => {
                          (e.target as SVGElement).style.color = "rgba(13,148,136,0.4)";
                        }}
                      />
                    </div>
                    {/* Subtle grid pattern */}
                    <div
                      className="absolute inset-0 opacity-[0.03]"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle, #fff 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                      }}
                    />
                    {/* Metric badge */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.12)" }}>
                      <span className="text-sm font-bold" style={{ color: "#0d9488" }}>{feature.metric}</span>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(13,148,136,0.5)" }}>{feature.metricLabel}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#5c6270" }}>
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 lg:py-36" style={{ background: "rgba(255,255,255,0.008)" }}>
        <div className="section-container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-24">
            <p className="eyebrow mb-5">How It Works</p>
            <h2
              className="font-bold text-white mb-6"
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              From Code to Launch
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#5c6270" }}>
              Four steps to shipping with confidence. No guesswork, no blind
              spots — just evidence.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative"
              >
                {/* Step number */}
                <div
                  className="text-6xl font-bold mb-6 tracking-tighter"
                  style={{ color: "rgba(13,148,136,0.1)", lineHeight: 1 }}
                >
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#5c6270" }}>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 lg:py-36">
        <div className="section-container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-24">
            <p className="eyebrow mb-5">Pricing</p>
            <h2
              className="font-bold text-white mb-6"
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Invest in Launch Readiness
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#5c6270" }}>
              Start free, scale as you ship more. Every plan includes our core
              AI analysis engine.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative rounded-2xl border p-8"
                style={{
                  background: plan.popular
                    ? "linear-gradient(180deg, rgba(13,24,37,0.8) 0%, rgba(8,12,20,0.8) 100%)"
                    : "linear-gradient(180deg, rgba(13,24,37,0.4) 0%, rgba(8,12,20,0.4) 100%)",
                  borderColor: plan.popular
                    ? "rgba(13,148,136,0.2)"
                    : "rgba(255,255,255,0.04)",
                  boxShadow: plan.popular
                    ? "0 0 60px -15px rgba(13,148,136,0.08), 0 25px 50px -20px rgba(0,0,0,0.4)"
                    : "0 25px 50px -20px rgba(0,0,0,0.3)",
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className="text-[10px] font-semibold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full"
                      style={{
                        background: "#0d9488",
                        color: "#02040a",
                      }}
                    >
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm" style={{ color: "#5c6270" }}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8">
                  <span className="text-5xl font-bold text-white tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-sm ml-1" style={{ color: "#5c6270" }}>
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm"
                      style={{ color: "#8a8f9d" }}
                    >
                      <Check
                        size={16}
                        className="mt-0.5 shrink-0"
                        style={{ color: "#0d9488" }}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <ObsidianButton
                  variant={plan.popular ? "primary" : "secondary"}
                  className="w-full"
                  onClick={() => setShowAuth(true)}
                >
                  {plan.cta}
                </ObsidianButton>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────────────────── */}
      <section className="py-28 lg:py-36" style={{ background: "rgba(255,255,255,0.008)" }}>
        <div className="section-container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-24">
            <h2
              className="font-bold text-white"
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Loved by Founders
            </h2>
          </motion.div>

          <motion.div
            {...staggerContainer}
            className="grid md:grid-cols-3 gap-5"
          >
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.author} {...staggerItem}>
                <div className="card-premium p-8 h-full flex flex-col">
                  {/* Stars — minimal */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        style={{ color: "#0d9488" }}
                        fill="#0d9488"
                      />
                    ))}
                  </div>

                  <p className="text-sm leading-relaxed mb-8 flex-1" style={{ color: "#8a8f9d" }}>
                    "{t.quote}"
                  </p>

                  <div
                    className="pt-6 border-t"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  >
                    <p className="text-sm font-semibold text-white mb-0.5">
                      {t.author}
                    </p>
                    <p className="text-xs mb-4" style={{ color: "#5c6270" }}>
                      {t.role}
                    </p>

                    {/* Metric badge */}
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{
                        background: "rgba(13,148,136,0.06)",
                        border: "1px solid rgba(13,148,136,0.1)",
                      }}
                    >
                      <span className="text-sm font-bold" style={{ color: "#0d9488" }}>
                        {t.metric}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(13,148,136,0.5)" }}>
                        {t.metricLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────── */}
      <section className="py-32 lg:py-40 relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13,148,136,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="section-container max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <h2
              className="font-bold text-white mb-7"
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Stop Guessing.
              <br />
              Start Shipping.
            </h2>
            <p className="text-lg mb-12 max-w-xl mx-auto leading-relaxed" style={{ color: "#5c6270" }}>
              Join 1,200+ builders who catch launch blockers before they ship —
              with evidence, not hope.
            </p>
            <ObsidianButton
              variant="primary"
              size="lg"
              onClick={() => setShowAuth(true)}
              className="gap-2"
            >
              Start Your 14-Day Free Trial
              <ArrowRight size={18} />
            </ObsidianButton>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t py-20" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.005)" }}>
        <div className="section-container max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <LogoMark size={22} />
                <span className="font-semibold text-white text-lg tracking-tight">NOCTRA</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#5c6270" }}>
                The observatory for shipping. Know your launch readiness before
                you push to prod.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-5">Product</h4>
              <ul className="space-y-3.5">
                {["Features", "Pricing", "Integrations", "Changelog"].map(
                  (item) => (
                    <li key={item}>
                      <span
                        className="text-sm transition-colors duration-200 cursor-pointer"
                        style={{ color: "#5c6270" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#8a8f9d")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#5c6270")}
                      >
                        {item}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-5">Company</h4>
              <ul className="space-y-3.5">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <span
                      className="text-sm transition-colors duration-200 cursor-pointer"
                      style={{ color: "#5c6270" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#8a8f9d")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#5c6270")}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-5">Legal</h4>
              <ul className="space-y-3.5">
                {["Privacy", "Terms", "Security"].map((item) => (
                  <li key={item}>
                    <span
                      className="text-sm transition-colors duration-200 cursor-pointer"
                      style={{ color: "#5c6270" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#8a8f9d")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#5c6270")}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-xs" style={{ color: "#3a4050" }}>
              © 2026 NOCTRA. All rights reserved.
            </p>
            <p className="text-xs" style={{ color: "#3a4050" }}>
              Ship with evidence.
            </p>
          </div>
        </div>
      </footer>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onDemo={handleDemo}
      />
    </div>
  );
}
