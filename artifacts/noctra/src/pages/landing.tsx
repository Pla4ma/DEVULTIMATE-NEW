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
  TrendingDown,
  Minus,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { ObsidianButton } from "@/components/ObsidianButton";
import { AuthModal } from "./landing/AuthModal";

/* ─── Data ───────────────────────────────────────────────────────────── */

const TRUSTED_BY = ["Stripe", "Vercel", "Linear", "Notion", "Figma"];

const STATS = [
  { value: "94%", label: "Blocker Detection Accuracy" },
  { value: "$2.4M", label: "Revenue Saved by Clients" },
  { value: "1,200+", label: "Active Service Firms" },
  { value: "32%", label: "Avg. Churn Reduction" },
];

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "AI Launch Readiness Scoring",
    description:
      "Our proprietary AI algorithm analyzes 50+ data points to predict launch blockers with 94% accuracy. Never ship broken code unexpectedly again.",
  },
  {
    icon: BarChart3,
    title: "Codebase Intelligence",
    description:
      "AI-powered analysis that predicts your next 6 months of technical debt with unprecedented precision. Fix issues before they become emergencies.",
  },
  {
    icon: Layers,
    title: "Predictive Build Analytics",
    description:
      "Know which features will ship over budget before they do. AI monitors project health, scope creep, and completion velocity in real time.",
  },
  {
    icon: Zap,
    title: "AI-Generated Fix Prompts",
    description:
      "Don't just see problems — get specific, actionable prompts you can paste into Cursor or Copilot to resolve blockers immediately.",
  },
];

const HOW_IT_WORKS = [
  {
    icon: Database,
    title: "Connect Your Code",
    description:
      "Import your repo via ZIP or GitHub. Our engine analyzes structure, dependencies, security posture, and code quality.",
  },
  {
    icon: Search,
    title: "AI Analyzes Patterns",
    description:
      "Our AI engine processes your codebase, identifies patterns, and scores launch readiness based on real-world shipping data.",
  },
  {
    icon: Lightbulb,
    title: "Get Actionable Insights",
    description:
      "Receive AI-generated insights with file-level evidence. Know exactly what needs attention, why, and how to fix it.",
  },
  {
    icon: TrendingUp,
    title: "Ship With Confidence",
    description:
      "Track improvements with every rescan. Watch your launch score climb as blockers are resolved, and ship when you hit green.",
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
      "The revenue forecasting is scary accurate. We stuck to the plan for 4 months straight. We've completely changed how we plan hiring.",
    author: "Marcus Johnson",
    role: "Partner, Johnson & Associates",
    metric: "3X",
    metricLabel: "revenue increase",
  },
  {
    quote:
      "We reduced client churn by 38% in the first quarter. The AI insights feel like having a Chief Client Officer who never sleeps.",
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
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: { staggerChildren: 0.12 },
  },
  viewport: { once: true, margin: "-80px" },
};

const staggerItem = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  viewport: { once: true },
};

/* ─── Dashboard Mockup Component ─────────────────────────────────────── */

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Glow behind */}
      <div
        className="absolute inset-0 -z-10 blur-3xl opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, #2dd4bf 0%, transparent 70%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl border overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #0f172a 0%, #0a0f1a 100%)",
          borderColor: "rgba(255,255,255,0.08)",
          boxShadow:
            "0 25px 80px -20px rgba(0,0,0,0.6), 0 0 60px -10px rgba(45,212,191,0.08)",
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center gap-2 px-5 py-3 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
          </div>
          <div className="ml-4 flex items-center gap-2 text-xs text-text-muted">
            <Lock size={10} />
            <span>app.noctra.dev</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-3 gap-4">
          {/* Left — score */}
          <div className="col-span-1 space-y-4">
            <div
              className="rounded-xl p-4 border"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-xs text-text-muted mb-2">Launch Score</p>
              <p className="text-3xl font-bold text-teal">87</p>
              <div className="mt-2 h-1.5 rounded-full bg-obsidian-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal"
                  style={{ width: "87%" }}
                />
              </div>
            </div>
            <div
              className="rounded-xl p-4 border"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-xs text-text-muted mb-2">Blockers</p>
              <div className="flex items-end gap-1">
                <p className="text-2xl font-bold text-red-400">3</p>
                <p className="text-xs text-text-muted mb-1">critical</p>
              </div>
            </div>
          </div>

          {/* Right — chart area */}
          <div
            className="col-span-2 rounded-xl border p-4 relative"
            style={{
              background: "rgba(255,255,255,0.02)",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <p className="text-xs text-text-muted mb-4">Readiness Trend</p>
            <div className="flex items-end gap-2 h-24">
              {[40, 55, 48, 62, 58, 71, 68, 79, 74, 87].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    background:
                      i === 9
                        ? "#2dd4bf"
                        : `rgba(45,212,191,${0.15 + i * 0.05})`,
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-text-muted">
              <span>Week 1</span>
              <span>Week 10</span>
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
    <div className="min-h-screen bg-obsidian-0 text-text-primary overflow-x-hidden">
      {/* Atmospheric background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(45,212,191,0.06) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232dd4bf' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* ─── Header ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-obsidian-0/80 backdrop-blur-md" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size={28} />

          <nav className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
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
      <section className="relative pt-32 pb-16 lg:pt-44 lg:pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8"
              style={{
                borderColor: "rgba(45,212,191,0.2)",
                background: "rgba(45,212,191,0.05)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse-subtle" />
              <span className="text-xs font-medium text-teal tracking-wide">
                AI-Powered Developer Intelligence
              </span>
            </motion.div>

            {/* Headline — plain white, massive, tight leading */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-bold tracking-tight text-white mb-6"
              style={{ fontSize: "clamp(2.8rem, 6.5vw, 5.5rem)", lineHeight: 1.05 }}
            >
              Ship With Evidence,
              <br />
              Not Hope.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
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
              <ObsidianButton
                variant="primary"
                size="lg"
                onClick={() => setShowAuth(true)}
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
          <div className="mt-20">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ─── Trusted By ───────────────────────────────────────────────── */}
      <section className="py-12 border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs text-text-muted uppercase tracking-[0.2em] mb-8">
            Trusted by forward-thinking builders
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            {TRUSTED_BY.map((name) => (
              <span
                key={name}
                className="text-sm text-text-muted/60 hover:text-text-muted transition-colors duration-300 cursor-default"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ───────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl sm:text-5xl font-bold text-teal mb-2 tracking-tight">
                  {stat.value}
                </p>
                <p className="text-sm text-text-muted">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────── */}
      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-20">
            <p className="eyebrow mb-4">Features</p>
            <h2
              className="font-bold tracking-tight text-white mb-5"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)", lineHeight: 1.1 }}
            >
              Intelligence That Pays for Itself
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Every feature designed to help you ship faster, catch blockers
              earlier, and launch with confidence — every single time.
            </p>
          </motion.div>

          <motion.div
            {...staggerContainer}
            className="grid sm:grid-cols-2 gap-6"
          >
            {FEATURES.map((feature) => (
              <motion.div key={feature.title} {...staggerItem}>
                <div
                  className="group rounded-2xl border p-6 h-full transition-all duration-300 hover:border-teal/30"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(15,23,42,0.8) 0%, rgba(10,15,26,0.8) 100%)",
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Image placeholder area */}
                  <div
                    className="w-full h-40 rounded-xl mb-6 border overflow-hidden relative"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(45,212,191,0.05) 0%, rgba(15,23,42,0.5) 100%)",
                      borderColor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <feature.icon
                        size={40}
                        className="text-teal/30 group-hover:text-teal/50 transition-colors duration-300"
                        strokeWidth={1}
                      />
                    </div>
                    {/* Decorative dots */}
                    <div className="absolute bottom-3 right-3 flex gap-1">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full bg-teal/20"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Icon circle */}
                  <div className="w-10 h-10 rounded-xl bg-teal-dim flex items-center justify-center mb-4">
                    <feature.icon
                      size={18}
                      className="text-teal"
                      strokeWidth={1.5}
                    />
                  </div>

                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 lg:py-32" style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-20">
            <p className="eyebrow mb-4">How It Works</p>
            <h2
              className="font-bold tracking-tight text-white mb-5"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)", lineHeight: 1.1 }}
            >
              From Code to Launch
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
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
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl border flex items-center justify-center mb-6" style={{ borderColor: "rgba(45,212,191,0.2)", background: "rgba(45,212,191,0.05)" }}>
                  <step.icon size={24} className="text-teal" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 lg:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-20">
            <p className="eyebrow mb-4">Pricing</p>
            <h2
              className="font-bold tracking-tight text-white mb-5"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)", lineHeight: 1.1 }}
            >
              Invest in Launch Readiness
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Start free, scale as you ship more. Every plan includes our core
              AI analysis engine.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative rounded-2xl border p-6"
                style={{
                  background: plan.popular
                    ? "linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(10,15,26,0.9) 100%)"
                    : "linear-gradient(180deg, rgba(15,23,42,0.6) 0%, rgba(10,15,26,0.6) 100%)",
                  borderColor: plan.popular
                    ? "rgba(45,212,191,0.3)"
                    : "rgba(255,255,255,0.06)",
                  boxShadow: plan.popular
                    ? "0 0 40px -10px rgba(45,212,191,0.15), 0 25px 50px -20px rgba(0,0,0,0.5)"
                    : "0 25px 50px -20px rgba(0,0,0,0.3)",
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-full bg-teal text-obsidian-0">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-text-muted">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-text-muted text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-text-secondary"
                    >
                      <Check
                        size={16}
                        className="text-teal mt-0.5 shrink-0"
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
      <section className="py-24 lg:py-32" style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-20">
            <h2
              className="font-bold tracking-tight text-white"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)", lineHeight: 1.1 }}
            >
              Loved by Founders
            </h2>
          </motion.div>

          <motion.div
            {...staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.author} {...staggerItem}>
                <div
                  className="rounded-2xl border p-6 h-full flex flex-col"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(15,23,42,0.6) 0%, rgba(10,15,26,0.6) 100%)",
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className="text-teal fill-teal"
                      />
                    ))}
                  </div>

                  <p className="text-sm text-text-secondary leading-relaxed mb-6 flex-1">
                    "{t.quote}"
                  </p>

                  <div className="pt-5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <p className="text-sm font-semibold text-text-primary">
                      {t.author}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{t.role}</p>

                    {/* Metric badge */}
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ borderColor: "rgba(45,212,191,0.15)", background: "rgba(45,212,191,0.05)" }}>
                      <span className="text-sm font-bold text-teal">{t.metric}</span>
                      <span className="text-xs text-text-muted">{t.metricLabel}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(45,212,191,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div {...fadeUp}>
            <h2
              className="font-bold tracking-tight text-white mb-5"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)", lineHeight: 1.1 }}
            >
              Stop Guessing.
              <br />
              Start Shipping.
            </h2>
            <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto leading-relaxed">
              Join 1,200+ builders who catch launch blockers before they ship —
              with evidence, not hope.
            </p>
            <ObsidianButton
              variant="primary"
              size="lg"
              onClick={() => setShowAuth(true)}
            >
              Start Your 14-Day Free Trial
              <ArrowRight size={18} />
            </ObsidianButton>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t py-16" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <LogoMark size={24} />
                <span className="font-semibold text-text-primary">NOCTRA</span>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                The observatory for shipping. Know your launch readiness before
                you push to prod.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-4">
                Product
              </h4>
              <ul className="space-y-3">
                {["Features", "Pricing", "Integrations", "Changelog"].map(
                  (item) => (
                    <li key={item}>
                      <span className="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer">
                        {item}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-4">
                Company
              </h4>
              <ul className="space-y-3">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-4">
                Legal
              </h4>
              <ul className="space-y-3">
                {["Privacy", "Terms", "Security"].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-xs text-text-muted">
              © 2026 NOCTRA. All rights reserved.
            </p>
            <p className="text-xs text-text-muted">
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
