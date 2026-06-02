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
  X,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { ObsidianButton } from "@/components/ObsidianButton";
import { AuthModal } from "./landing/AuthModal";

/* ─── Data ───────────────────────────────────────────────────────────── */

const INTEGRATIONS = ["Cursor", "Replit", "Windsurf", "VS Code", "GitHub"];

const STATS = [
  { value: "10K+", label: "Projects Analyzed" },
  { value: "87%", label: "Blocker Detection Rate" },
  { value: "4.9", label: "Developer Rating" },
  { value: "<2min", label: "Avg Scan to Fix Time" },
];

const FEATURES = [
  {
    icon: Stethoscope,
    title: "Launch Readiness Scan",
    description:
      "Upload your repo — get an evidence-backed launch score, RED/YELLOW/GREEN gates, and prioritized fix tasks.",
  },
  {
    icon: Target,
    title: "Blocker Detection",
    description:
      "Every finding includes file-level evidence. Know exactly what blocks launch and where to fix it.",
  },
  {
    icon: CheckSquare,
    title: "Fix Task Generation",
    description:
      "Every blocker becomes a prioritized task. Fix, then rescan to verify your score improved.",
  },
  {
    icon: RotateCcw,
    title: "Rescan Improvement Loop",
    description:
      "Fix → rescan → see your score improve. Track launch readiness over time with every iteration.",
  },
  {
    icon: Brain,
    title: "Idea Validation",
    description:
      "Score ideas for signal strength, red flags, and ICP fit before investing in code.",
  },
  {
    icon: Rocket,
    title: "Launch Workflow",
    description:
      "Idea → MVP → project → scan → fix → rescan → launch. A complete pipeline from concept to shipping.",
  },
];

const HOW_IT_WORKS = [
  {
    icon: Scan,
    step: "01",
    title: "Scan",
    description: "Upload your codebase — get a launch readiness score with evidence-backed blockers.",
  },
  {
    icon: Wrench,
    step: "02",
    title: "Fix",
    description: "Work through the prioritized fix task queue generated from your scan.",
  },
  {
    icon: RotateCcw,
    step: "03",
    title: "Rescan",
    description: "Upload the fixed codebase — see your score improve as blockers are resolved.",
  },
  {
    icon: TrendingUp,
    step: "04",
    title: "Ship",
    description: "When all gates are green and your score is launch-ready, ship with confidence.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    description: "For developers just getting started",
    features: [
      "3 AI analyses per month",
      "Basic idea validation",
      "Codebase diagnosis (limited)",
      "Email support",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Professional",
    price: "$29",
    period: "/month",
    description: "For serious builders and indie hackers",
    features: [
      "200 AI analyses per month",
      "Full intelligence suite",
      "100 codebase scans per month",
      "Priority processing",
      "Fix task generation",
      "Rescan improvement loop",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/month",
    description: "For teams shipping at scale",
    features: [
      "Unlimited analyses",
      "Custom AI model training",
      "Unlimited scans",
      "Team collaboration",
      "White-label reports",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const TESTIMONIALS = [
  {
    quote: "NOCTRA found 12 critical launch blockers in my codebase — hardcoded API keys, missing rate limits, no error handling. Fixed everything before shipping. The rescan loop showed my score go from 34 to 89.",
    author: "Jonathan",
    role: "Founder, VEX",
    metric: "34 → 89",
    metricLabel: "Launch Score",
  },
  {
    quote: "The scan→fix→rescan loop is a game changer. Each rescan shows my launch readiness score improving as I fix issues. It turns code review into a measurable process.",
    author: "Alex Chen",
    role: "Indie Hacker",
    metric: "+340%",
    metricLabel: "Readiness Improvement",
  },
  {
    quote: "We changed our pricing from $19 to $49/mo based on market signal analysis. 3x revenue from day one. The evidence-backed blockers gave us confidence to ship.",
    author: "Sarah Miller",
    role: "Solo Founder, SaaS",
    metric: "3x",
    metricLabel: "Revenue Increase",
  },
];

/* ─── Animation Helpers ──────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: { staggerChildren: 0.1 },
  },
  viewport: { once: true, margin: "-80px" },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  viewport: { once: true },
};

/* ─── Landing Page ───────────────────────────────────────────────────── */

export default function LandingPage() {
  const { signIn, signUp, signInDemo, user } = useAuth();
  const [, navigate] = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-default bg-obsidian-0/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size={28} />

          <nav className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
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
              Get Started <ArrowUpRight size={14} />
            </ObsidianButton>
          </div>
        </div>
      </header>

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-glow-teal pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-obsidian-2 border border-border-default mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse-subtle" />
              <span className="text-xs font-medium text-teal tracking-wide">
                AI-Powered Developer Intelligence
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-bold tracking-tight leading-[1.1] mb-6 text-gradient-teal"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
            >
              Ship With Evidence,
              <br />
              Not Hope.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Point NOCTRA at your codebase. Get a launch readiness score,
              prioritized blockers, and fix prompts you can paste straight
              into your AI IDE.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <ObsidianButton
                variant="primary"
                size="lg"
                onClick={() => setShowAuth(true)}
              >
                <Play size={18} fill="currentColor" />
                Start Free Analysis
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

            {/* Integration logos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-16 pt-8 border-t border-border-default"
            >
              <p className="text-xs text-text-muted uppercase tracking-wider mb-6">
                Works with your stack
              </p>
              <div className="flex items-center justify-center gap-8 flex-wrap">
                {INTEGRATIONS.map((name) => (
                  <span
                    key={name}
                    className="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-default"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Stats ───────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-border-default bg-obsidian-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl font-bold text-teal mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-text-muted">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────── */}
      <section id="features" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="eyebrow mb-4">Features</p>
            <h2
              className="font-bold tracking-tight mb-4"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Intelligence That Pays for Itself
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Every feature designed to help you ship faster, catch blockers
              earlier, and launch with confidence.
            </p>
          </motion.div>

          <motion.div
            {...staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((feature) => (
              <motion.div key={feature.title} {...staggerItem}>
                <div className="group bg-obsidian-1 border border-border-default rounded-xl p-6 h-full card-lift hover:border-teal/30 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-teal-dim flex items-center justify-center mb-5 group-hover:bg-teal/20 transition-colors">
                    <feature.icon
                      size={22}
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
      <section id="how-it-works" className="py-24 sm:py-32 bg-obsidian-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="eyebrow mb-4">How It Works</p>
            <h2
              className="font-bold tracking-tight mb-4"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              From Code to Launch
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Four steps to shipping with confidence.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden lg:block absolute top-10 left-[12%] right-[12%] h-px bg-border-default" />

            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-obsidian-2 border border-border-default flex items-center justify-center mb-6 relative z-10">
                  <step.icon size={24} className="text-teal" strokeWidth={1.5} />
                </div>
                <span className="font-mono text-sm text-teal font-medium">
                  {step.step}
                </span>
                <h3 className="text-xl font-semibold mt-2 mb-2 text-text-primary">
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
      <section id="pricing" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="eyebrow mb-4">Pricing</p>
            <h2
              className="font-bold tracking-tight mb-4"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Invest in Launch Readiness
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Start free, scale as you ship more.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`relative rounded-xl border p-6 ${
                  plan.popular
                    ? "bg-obsidian-1 border-teal/40 shadow-[0_0_30px_rgba(45,212,191,0.08)]"
                    : "bg-obsidian-1 border-border-default"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full bg-teal text-obsidian-0">
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
                  <span className="text-4xl font-bold text-text-primary">
                    {plan.price}
                  </span>
                  <span className="text-text-muted">{plan.period}</span>
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
      <section className="py-24 sm:py-32 bg-obsidian-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="eyebrow mb-4">Loved by Builders</p>
            <h2
              className="font-bold tracking-tight"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
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
                <div className="bg-obsidian-2 border border-border-default rounded-xl p-6 h-full card-lift">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className="text-teal fill-teal"
                      />
                    ))}
                  </div>

                  <p className="text-sm text-text-secondary leading-relaxed mb-6 italic">
                    "{t.quote}"
                  </p>

                  <div className="pt-4 border-t border-border-default">
                    <p className="text-sm font-semibold text-text-primary">
                      {t.author}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div {...fadeUp}>
            <div className="mb-6 flex justify-center">
              <LogoMark size={48} />
            </div>
            <h2
              className="font-bold tracking-tight mb-4"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
            >
              Stop Guessing.
              <br />
              <span className="text-gradient-teal">Start Shipping.</span>
            </h2>
            <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto">
              Join the builders who catch launch blockers before they ship —
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
      <footer className="border-t border-border-default bg-obsidian-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Logo size={24} className="mb-4" />
              <p className="text-sm text-text-muted leading-relaxed">
                The observatory for shipping. Know your launch readiness before
                you push to prod.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-4">
                Product
              </h4>
              <ul className="space-y-2">
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
              <ul className="space-y-2">
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
              <ul className="space-y-2">
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

          <div className="pt-8 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-4">
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
