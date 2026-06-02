import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { supabaseConfigError } from "@/integrations/supabase/client";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowUpRight, Play, Star, Stethoscope, Target, CheckSquare,
  RotateCcw, Brain, Rocket, Zap, TrendingUp, Shield, Scan, Wrench,
  Check, ArrowRight, BarChart3, Lightbulb, Layers, Database,
  BrainCircuit, Search, Lock, Gauge, Bell, Settings, User,
  Activity, ChevronRight, Sparkles, ShieldCheck, Globe, Code2,
  RefreshCw, TrendingDown, Minus, XCircle, CheckCircle,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { AuthModal } from "./landing/AuthModal";
import { Magnetic } from "@/components/effects/Magnetic";
import { Tilt } from "@/components/effects/Tilt";
import { Spotlight } from "@/components/effects/Spotlight";
import { AnimatedCounter } from "@/components/effects/AnimatedCounter";
import { Marquee } from "@/components/effects/Marquee";
import { TextScramble } from "@/components/effects/TextScramble";

/* ─── Data ───────────────────────────────────────────────────────────── */

const TRUSTED_BY = [
  "Stripe","Vercel","Linear","Notion","Figma","Raycast","Supabase","GitHub",
  "Vercel","Linear","Notion","Figma","Raycast","Supabase","GitHub","Stripe",
];

const STATS = [
  { value: "94%", label: "Blocker Detection" },
  { value: "$2.4M", label: "Revenue Saved" },
  { value: "1,200+", label: "Active Teams" },
  { value: "32%", label: "Churn Reduction" },
];

const FEATURES = [
  { icon: BrainCircuit, title: "AI Launch Readiness Scoring",
    description: "Our proprietary AI analyzes 50+ data points across your codebase to predict launch blockers with 94% accuracy.",
    metric: "94%", metricLabel: "accuracy", gradient: "from-violet-500/20 to-fuchsia-500/20" },
  { icon: BarChart3, title: "Codebase Intelligence",
    description: "AI-powered analysis that predicts your next 6 months of technical debt before it becomes an emergency.",
    metric: "6mo", metricLabel: "forecast", gradient: "from-blue-500/20 to-violet-500/20" },
  { icon: Layers, title: "Predictive Build Analytics",
    description: "Know which features will ship over budget before they do. AI monitors project health in real time.",
    metric: "实时", metricLabel: "monitoring", gradient: "from-fuchsia-500/20 to-pink-500/20" },
  { icon: Zap, title: "AI-Generated Fix Prompts",
    description: "Don't just see problems — get specific, actionable prompts you can paste into Cursor or Copilot immediately.",
    metric: "<2min", metricLabel: "to fix", gradient: "from-violet-500/20 to-indigo-500/20" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Connect Your Code",
    description: "Import your repo via ZIP or GitHub. Our engine analyzes structure, dependencies, security posture, and code quality in seconds." },
  { step: "02", title: "AI Analyzes Patterns",
    description: "Our AI engine processes your codebase, identifies anti-patterns, and scores launch readiness based on real-world shipping data." },
  { step: "03", title: "Get Actionable Insights",
    description: "Receive AI-generated insights with file-level evidence. Know exactly what needs attention, why it matters, and how to fix it." },
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
  { quote: "We reduced client churn by 38% in the first quarter. The AI insights feel like having a Chief Client Officer who never sleeps, constantly monitoring every relationship.",
    author: "Elena Rodriguez", role: "Managing Director, Focus Agency", metric: "38%", metricLabel: "churn reduction" },
];

/* ─── Dashboard Mockup ───────────────────────────────────────────────── */

function DashboardMockup() {
  return (
    <Tilt intensity={8} className="relative w-full max-w-5xl mx-auto">
      <div className="absolute -inset-40 -z-10 opacity-50" style={{
        background: "radial-gradient(ellipse 50% 40% at 50% 60%, rgba(168,85,247,0.5) 0%, transparent 70%)",
        filter: "blur(80px)"
      }} />

      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: "linear-gradient(180deg, rgba(15,10,30,0.95) 0%, rgba(6,3,15,0.95) 100%)",
          border: "1px solid rgba(168, 85, 247, 0.2)",
          boxShadow: "0 40px 120px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 100px -20px rgba(168,85,247,0.4)",
        }}
      >
        {/* Inner glow border */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
          background: "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, transparent 40%, transparent 60%, rgba(232,121,249,0.08) 100%)",
        }} />

        {/* Window chrome */}
        <div className="flex items-center gap-3 px-5 py-3 border-b relative" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#eab308" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", color: "#7a7390" }}>
              <Lock size={10} /><span>app.noctra.dev</span>
            </div>
          </div>
          <div className="w-16" />
        </div>

        {/* App content */}
        <div className="p-5 grid grid-cols-12 gap-3">
          {/* Sidebar */}
          <div className="col-span-2 space-y-2">
            {[{ icon: Gauge, label: "Dashboard", active: true },
              { icon: Stethoscope, label: "Health", active: false },
              { icon: Brain, label: "Brain", active: false },
              { icon: BarChart3, label: "Analytics", active: false },
              { icon: Settings, label: "Settings", active: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] transition-all duration-300"
                style={{
                  background: item.active ? "linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(232,121,249,0.06) 100%)" : "transparent",
                  color: item.active ? "#c084fc" : "#7a7390",
                  border: item.active ? "1px solid rgba(168,85,247,0.2)" : "1px solid transparent",
                }}>
                <item.icon size={13} strokeWidth={item.active ? 2 : 1.5} />
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Main area */}
          <div className="col-span-10 space-y-3">
            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-3">
              {[{ label: "Launch Score", value: "87", color: "#a855f7", width: "87%", sub: "ready" },
                { label: "Blockers", value: "3", color: "#ef4444", width: "30%", sub: "critical" },
                { label: "Health Trend", value: "+12%", color: "#22c55e", width: "65%", sub: "vs last week" },
              ].map((card) => (
                <div key={card.label} className="rounded-xl p-3.5 relative overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                    background: `radial-gradient(circle at 50% 0%, ${card.color}18 0%, transparent 70%)`
                  }} />
                  <div className="relative">
                    <p className="text-[9px] uppercase tracking-[0.15em] mb-2.5" style={{ color: "#7a7390" }}>{card.label}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
                        {card.sub && <p className="text-[9px] mt-0.5" style={{ color: "#7a7390" }}>{card.sub}</p>}
                      </div>
                      <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="h-full rounded-full" style={{ width: card.width, background: card.color, opacity: 0.7 }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] uppercase tracking-[0.15em]" style={{ color: "#7a7390" }}>Readiness Trend</p>
                <div className="flex gap-1">
                  {["1W","1M","3M","6M"].map((p, i) => (
                    <span key={p} className="text-[9px] px-2 py-0.5 rounded font-medium"
                      style={{ background: i === 1 ? "rgba(168,85,247,0.1)" : "transparent", color: i === 1 ? "#c084fc" : "#7a7390" }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-[2px] h-24">
                {[35,42,38,48,55,52,61,58,67,72,68,75,71,78,82,79,85,87].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm transition-all duration-500"
                    style={{
                      height: `${h}%`,
                      background: i >= 15 ? "linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)" : `rgba(168, 85, 247, ${0.1 + (i / 20) * 0.3})`,
                      boxShadow: i >= 15 ? "0 0 8px rgba(168,85,247,0.4)" : "none",
                    }} />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {["Jan","Feb","Mar","Apr","May","Jun"].map((m) => (
                  <span key={m} className="text-[8px]" style={{ color: "#4a4560" }}>{m}</span>
                ))}
              </div>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <p className="text-[9px] uppercase tracking-[0.15em] mb-3" style={{ color: "#7a7390" }}>Top Blockers</p>
                {[{ text: "Hardcoded API keys in config.js", type: "critical" },
                  { text: "Missing rate limiting on /api/*", type: "high" },
                  { text: "No error handling in auth flow", type: "medium" },
                ].map((task, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5"
                    style={{ borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                      background: task.type === "critical" ? "#ef4444" : task.type === "high" ? "#eab308" : "#a855f7",
                      boxShadow: task.type === "critical" ? "0 0 6px rgba(239,68,68,0.5)" : "none",
                    }} />
                    <span className="text-[10px] truncate" style={{ color: "#b4aec8" }}>{task.text}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <p className="text-[9px] uppercase tracking-[0.15em] mb-3" style={{ color: "#7a7390" }}>Recent Activity</p>
                {[{ text: "Scan completed — 12 issues found", time: "2m ago" },
                  { text: "Blocker resolved — auth flow", time: "1h ago" },
                  { text: "Score improved 34 → 89", time: "3h ago" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5"
                    style={{ borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                    <span className="text-[10px] truncate" style={{ color: "#b4aec8" }}>{item.text}</span>
                    <span className="text-[9px] shrink-0" style={{ color: "#4a4560" }}>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Tilt>
  );
}

/* ─── Animation Helpers ──────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.12 } },
  viewport: { once: true, margin: "-100px" },
};

const staggerItem = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
  viewport: { once: true },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

/* ─── Landing Page ───────────────────────────────────────────────────── */

export default function LandingPage() {
  const { signIn, signUp, signInDemo, user } = useAuth();
  const [, navigate] = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const supabaseReady = !supabaseConfigError;

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 100]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);

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
      {/* ═════════ GLOBAL BACKGROUND LAYERS ═════════ */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-aurora" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M0 30h60M30 0v60' stroke='%23a855f7' stroke-width='0.3' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }} />
        {/* Floating orbs */}
        <div className="absolute rounded-full animate-float" style={{ width: 600, height: 600, left: "-10%", top: "-10%",
          background: "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute rounded-full animate-float-slow" style={{ width: 500, height: 500, right: "-5%", top: "15%",
          background: "radial-gradient(circle, rgba(232,121,249,0.15) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute rounded-full animate-float-reverse" style={{ width: 450, height: 450, left: "30%", top: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute rounded-full animate-float" style={{ width: 400, height: 400, right: "20%", bottom: "10%",
          background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)", filter: "blur(80px)", animationDelay: "3s" }} />
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* ═════════ HEADER ═════════ */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl"
        style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(3, 0, 10, 0.7)" }}
      >
        <div className="section-container h-16 flex items-center justify-between">
          <Logo size={26} />
          <nav className="hidden md:flex items-center gap-8">
            {["Features","How It Works","Pricing"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm transition-colors duration-300 relative group"
                style={{ color: "#b4aec8" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f5f0ff"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#b4aec8"; }}
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-aurora-400 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Magnetic strength={0.4}>
              <button onClick={() => setShowAuth(true)}
                className="inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 hover:bg-white/5 rounded-lg px-4 py-2"
                style={{ color: "#b4aec8" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f5f0ff"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#b4aec8"; }}>
                Sign in
              </button>
            </Magnetic>
            <Magnetic strength={0.3}>
              <button onClick={() => setShowAuth(true)}
                className="group relative inline-flex items-center justify-center gap-2 text-sm font-semibold rounded-xl px-5 py-2.5 transition-all duration-300 overflow-hidden animate-glow"
                style={{
                  background: "linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #e879f9 100%)",
                  color: "#03000a",
                  boxShadow: "0 0 40px rgba(168,85,247,0.25)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 60px rgba(168,85,247,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(168,85,247,0.25)";
                }}>
                <span className="absolute inset-0 bg-aurora-gradient opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
                Get Started
              </button>
            </Magnetic>
          </div>
        </div>
      </motion.header>

      {/* ═════════ HERO ═════════ */}
      <motion.section className="relative pt-36 pb-20 lg:pt-48 lg:pb-28 overflow-hidden" style={{ y: heroY, opacity: heroOpacity }}>
        {/* Floating decorative elements */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute animate-spin-slow" style={{ width: 280, height: 280, right: "8%", top: "10%",
            border: "1px solid rgba(168,85,247,0.12)", borderRadius: "50%", background: "radial-gradient(circle, transparent 60%, rgba(168,85,247,0.03) 100%)" }} />
          <div className="absolute animate-spin-reverse" style={{ width: 200, height: 200, right: "12%", top: "15%",
            border: "1px solid rgba(232,121,249,0.08)", borderRadius: "50%" }} />
          <div className="absolute animate-blob-morph animate-pulse-slow" style={{ width: 200, height: 200, left: "55%", top: "35%",
            background: "linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(232,121,249,0.06) 100%)", filter: "blur(2px)" }} />
          <div className="absolute animate-pulse-soft" style={{ width: 6, height: 6, right: "18%", top: "28%",
            background: "#c084fc", borderRadius: "50%", boxShadow: "0 0 20px #c084fc, 0 0 40px #a855f7" }} />
          <div className="absolute animate-pulse-soft" style={{ width: 4, height: 4, left: "12%", top: "45%",
            background: "#e879f9", borderRadius: "50%", boxShadow: "0 0 20px #e879f9", animationDelay: "1s" }} />
          <div className="absolute animate-pulse-soft" style={{ width: 3, height: 3, left: "35%", top: "12%",
            background: "#22d3ee", borderRadius: "50%", boxShadow: "0 0 15px #22d3ee", animationDelay: "2s" }} />
        </div>

        <div className="section-container relative">
          <div className="max-w-5xl mx-auto text-center mb-20">
            {/* Eyebrow with glow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border mb-10 backdrop-blur-sm relative overflow-hidden"
              style={{ borderColor: "rgba(168, 85, 247, 0.2)", background: "rgba(168, 85, 247, 0.04)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ background: "#c084fc", boxShadow: "0 0 8px rgba(192,132,252,0.6)" }} />
              <span className="text-[11px] font-medium tracking-wide" style={{ color: "#c084fc" }}>
                <TextScramble text="AI-Powered Developer Intelligence" speed={40} delay={500} />
              </span>
              <ChevronRight size={12} style={{ color: "#c084fc" }} />
            </motion.div>

            {/* Massive multi-colored headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.1 }}
              className="font-bold mb-8 leading-[1.02] tracking-[-0.03em]"
              style={{ fontSize: "clamp(3.2rem, 8vw, 7rem)" }}
            >
              <span className="block text-white">Ship With</span>
              <span className="block text-gradient-flow">Evidence,</span>
              <span className="block text-white">Not Hope.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
              style={{ color: "#b4aec8" }}
            >
              Point NOCTRA at your codebase. Get a launch readiness score,
              prioritized blockers, and fix prompts you can paste straight into
              your AI IDE.
            </motion.p>

            {/* Magnetic CTAs with beam */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Magnetic strength={0.3}>
                <button onClick={() => setShowAuth(true)}
                  className="group relative inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold transition-all duration-300 overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #e879f9 100%)",
                    color: "#03000a",
                    boxShadow: "0 0 60px rgba(168,85,247,0.3), 0 20px 40px -10px rgba(168,85,247,0.2)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 80px rgba(168,85,247,0.5), 0 20px 40px -10px rgba(168,85,247,0.3)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 60px rgba(168,85,247,0.3), 0 20px 40px -10px rgba(168,85,247,0.2)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }}>
                  {/* Beam sweep */}
                  <span className="absolute inset-0 overflow-hidden rounded-xl">
                    <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)", skewX: "-20deg" }} />
                  </span>
                  <Play size={16} fill="currentColor" />
                  Start Your Free Trial
                </button>
              </Magnetic>

              <Magnetic strength={0.3}>
                <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-medium transition-all duration-300 backdrop-blur-md border border-white/10 text-text-primary hover:bg-white/10 hover:border-aurora-400/30">
                  See How It Works
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
              </Magnetic>
            </motion.div>
          </div>

          <DashboardMockup />
        </div>
      </motion.section>

      {/* ═════════ TRUSTED BY (Marquee) ═════════ */}
      <section className="py-20 border-y relative overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <div className="absolute inset-0 -z-10 opacity-30" style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.03) 50%, transparent 100%)"
        }} />
        <p className="text-center text-[10px] uppercase tracking-[0.3em] mb-10" style={{ color: "#4a4560" }}>
          Trusted by forward-thinking builders
        </p>
        <Marquee speed="normal" pauseOnHover>
          {TRUSTED_BY.map((name, i) => (
            <span key={i} className="text-sm font-medium mx-10 cursor-default transition-all duration-500"
              style={{ color: "#4a4560" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#b4aec8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4a4560"; }}>
              {name}
            </span>
          ))}
        </Marquee>
      </section>

      {/* ═════════ STATS ═════════ */}
      <section className="py-28 lg:py-36 relative">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 -z-10 opacity-20 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="section-container max-w-6xl">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="eyebrow mb-5">Impact</p>
            <h2 className="font-bold text-white mb-6 tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2.5rem, 5.5vw, 4rem)" }}>
              Numbers That
              <br /><span className="text-gradient-aurora">Speak</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="relative">
                  <p className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-3 tracking-[-0.03em] leading-none"
                    style={{
                      background: "linear-gradient(135deg, #f5f0ff 0%, #c084fc 50%, #e879f9 100%)",
                      WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
                    }}>
                    <AnimatedCounter value={stat.value} duration={2000 + i * 300} />
                  </p>
                </div>
                <p className="text-sm" style={{ color: "#7a7390" }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ FEATURES (Bento Grid + 3D Tilt) ═════════ */}
      <section id="features" className="py-28 lg:py-36 relative">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 -z-10 opacity-20 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="section-container max-w-6xl">
          <motion.div {...fadeUp} className="text-center mb-24">
            <p className="eyebrow mb-5">Features</p>
            <h2 className="font-bold text-white mb-6 tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2.5rem, 5.5vw, 4rem)" }}>
              Intelligence That
              <br /><span className="text-gradient-aurora">Pays for Itself</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#7a7390" }}>
              Every feature designed to help you ship faster, catch blockers earlier, and launch with confidence — every single time.
            </p>
          </motion.div>

          <motion.div {...staggerContainer} className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map((feature) => (
              <motion.div key={feature.title} {...staggerItem}>
                <Tilt intensity={10} glare className="h-full">
                  <Spotlight size={300} color="rgba(168, 85, 247, 0.08)" className="h-full">
                    <div className="card-glass p-7 h-full group">
                      {/* Image area with aurora gradient */}
                      <div className="w-full h-52 rounded-xl mb-7 overflow-hidden relative"
                        style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(15,10,30,0.4) 100%)", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div className="absolute inset-0 opacity-20" style={{
                          backgroundImage: "radial-gradient(circle, rgba(168,85,247,0.4) 1px, transparent 1px)",
                          backgroundSize: "20px 20px",
                        }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                            style={{
                              background: "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(232,121,249,0.1) 100%)",
                              border: "1px solid rgba(168,85,247,0.2)",
                              boxShadow: "0 0 30px rgba(168,85,247,0.15)",
                            }}>
                            <feature.icon size={32} strokeWidth={1.5} style={{ color: "#c084fc" }} />
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-sm"
                          style={{ background: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.15)" }}>
                          <span className="text-sm font-bold" style={{ color: "#c084fc" }}>{feature.metric}</span>
                          <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(192,132,252,0.5)" }}>{feature.metricLabel}</span>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-2.5">{feature.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#b4aec8" }}>{feature.description}</p>
                    </div>
                  </Spotlight>
                </Tilt>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═════════ HOW IT WORKS ═════════ */}
      <section id="how-it-works" className="py-28 lg:py-36 relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, rgba(168,85,247,0.02) 0%, transparent 100%)" }}>
        <div className="section-container max-w-6xl">
          <motion.div {...fadeUp} className="text-center mb-24">
            <p className="eyebrow mb-5">How It Works</p>
            <h2 className="font-bold text-white mb-6 tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2.5rem, 5.5vw, 4rem)" }}>
              From Code to
              <br /><span className="text-gradient-aurora">Launch</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#7a7390" }}>
              Four steps to shipping with confidence. No guesswork, no blind spots — just evidence.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="relative"
              >
                <div className="text-7xl font-bold mb-6 tracking-tighter leading-none"
                  style={{
                    background: "linear-gradient(135deg, rgba(168,85,247,0.3) 0%, rgba(232,121,249,0.1) 100%)",
                    WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#b4aec8" }}>{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ PRICING ═════════ */}
      <section id="pricing" className="py-28 lg:py-36 relative">
        <div className="section-container max-w-6xl">
          <motion.div {...fadeUp} className="text-center mb-24">
            <p className="eyebrow mb-5">Pricing</p>
            <h2 className="font-bold text-white mb-6 tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2.5rem, 5.5vw, 4rem)" }}>
              Invest in
              <br /><span className="text-gradient-aurora">Launch Readiness</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#7a7390" }}>
              Start free, scale as you ship more. Every plan includes our core AI analysis engine.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((plan, i) => (
              <motion.div key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="relative"
              >
                {plan.popular ? (
                  <Tilt intensity={5} className="h-full">
                    <div className="card-glass-popular p-8 h-full">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full"
                          style={{ background: "linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #e879f9 100%)", color: "#03000a", boxShadow: "0 0 30px rgba(168,85,247,0.4)" }}>
                          Most Popular
                        </span>
                      </div>
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-white mb-2">{plan.name}</h3>
                        <p className="text-sm" style={{ color: "#b4aec8" }}>{plan.description}</p>
                      </div>
                      <div className="mb-8">
                        <span className="text-5xl font-bold text-white tracking-[-0.03em]">{plan.price}</span>
                        <span className="text-sm ml-1" style={{ color: "#7a7390" }}>{plan.period}</span>
                      </div>
                      <ul className="space-y-4 mb-10">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3 text-sm" style={{ color: "#b4aec8" }}>
                            <Check size={16} className="mt-0.5 shrink-0" style={{ color: "#c084fc" }} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Magnetic strength={0.2} className="w-full">
                        <button onClick={() => setShowAuth(true)}
                          className="w-full group relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300 overflow-hidden"
                          style={{
                            background: "linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #e879f9 100%)",
                            color: "#03000a",
                            boxShadow: "0 0 40px rgba(168,85,247,0.2)",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 60px rgba(168,85,247,0.4)";
                            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(168,85,247,0.2)";
                            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                          }}>
                          <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"
                            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)", skewX: "-20deg" }} />
                          {plan.cta}
                        </button>
                      </Magnetic>
                    </div>
                  </Tilt>
                ) : (
                  <Tilt intensity={8} className="h-full">
                    <div className="card-glass p-8 h-full">
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-white mb-2">{plan.name}</h3>
                        <p className="text-sm" style={{ color: "#b4aec8" }}>{plan.description}</p>
                      </div>
                      <div className="mb-8">
                        <span className="text-5xl font-bold text-white tracking-[-0.03em]">{plan.price}</span>
                        <span className="text-sm ml-1" style={{ color: "#7a7390" }}>{plan.period}</span>
                      </div>
                      <ul className="space-y-4 mb-10">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3 text-sm" style={{ color: "#b4aec8" }}>
                            <Check size={16} className="mt-0.5 shrink-0" style={{ color: "#7a7390" }} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Magnetic strength={0.2} className="w-full">
                        <button onClick={() => setShowAuth(true)}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-300 backdrop-blur-md border border-white/10 text-text-primary hover:bg-white/10 hover:border-aurora-400/30 hover:text-white">
                          {plan.cta}
                        </button>
                      </Magnetic>
                    </div>
                  </Tilt>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ TESTIMONIALS ═════════ */}
      <section className="py-28 lg:py-36 relative"
        style={{ background: "linear-gradient(180deg, transparent 0%, rgba(168,85,247,0.02) 50%, transparent 100%)" }}>
        <div className="section-container max-w-6xl">
          <motion.div {...fadeUp} className="text-center mb-24">
            <h2 className="font-bold text-white tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2.5rem, 5.5vw, 4rem)" }}>
              Loved by
              <br /><span className="text-gradient-aurora">Founders</span>
            </h2>
          </motion.div>

          <motion.div {...staggerContainer} className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.author} {...staggerItem}>
                <Tilt intensity={6} glare className="h-full">
                  <Spotlight size={250} color="rgba(168, 85, 247, 0.06)" className="h-full">
                    <div className="card-glass p-8 h-full flex flex-col">
                      {/* Animated glowing stars */}
                      <div className="flex gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} style={{ color: "#c084fc", filter: "drop-shadow(0 0 6px rgba(192,132,252,0.5))" }} fill="#c084fc" />
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed mb-8 flex-1" style={{ color: "#b4aec8" }}>"{t.quote}"</p>
                      <div className="pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        <p className="text-sm font-semibold text-white mb-0.5">{t.author}</p>
                        <p className="text-xs mb-4" style={{ color: "#7a7390" }}>{t.role}</p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-sm"
                          style={{ background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.12)" }}>
                          <span className="text-sm font-bold" style={{ color: "#c084fc" }}>{t.metric}</span>
                          <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(192,132,252,0.5)" }}>{t.metricLabel}</span>
                        </div>
                      </div>
                    </div>
                  </Spotlight>
                </Tilt>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═════════ FINAL CTA ═════════ */}
      <section className="py-32 lg:py-40 relative overflow-hidden">
        <div className="absolute inset-0 -z-10"
          style={{ background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(168, 85, 247, 0.12) 0%, transparent 70%)" }} />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full animate-float opacity-20" style={{
          background: "radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%)", filter: "blur(40px)"
        }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full animate-float-slow opacity-20" style={{
          background: "radial-gradient(circle, rgba(232,121,249,0.5) 0%, transparent 70%)", filter: "blur(40px)"
        }} />

        <div className="section-container max-w-3xl text-center relative">
          <motion.div {...fadeUp}>
            <h2 className="font-bold text-white mb-7 tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2.5rem, 5.5vw, 4rem)" }}>
              Stop Guessing.
              <br /><span className="text-gradient-flow">Start Shipping.</span>
            </h2>
            <p className="text-lg mb-12 max-w-xl mx-auto leading-relaxed" style={{ color: "#b4aec8" }}>
              Join 1,200+ builders who catch launch blockers before they ship — with evidence, not hope.
            </p>
            <Magnetic strength={0.25}>
              <button onClick={() => setShowAuth(true)}
                className="group relative inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-sm font-semibold transition-all duration-300 overflow-hidden animate-glow"
                style={{
                  background: "linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #e879f9 100%)",
                  color: "#03000a",
                  boxShadow: "0 0 60px rgba(168,85,247,0.3), 0 20px 40px -10px rgba(168,85,247,0.2)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 80px rgba(168,85,247,0.5), 0 20px 40px -10px rgba(168,85,247,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 60px rgba(168,85,247,0.3), 0 20px 40px -10px rgba(168,85,247,0.2)";
                }}>
                {/* Beam sweep */}
                <span className="absolute inset-0 overflow-hidden rounded-xl">
                  <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)", skewX: "-20deg" }} />
                </span>
                Start Your 14-Day Free Trial
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            </Magnetic>
          </motion.div>
        </div>
      </section>

      {/* ═════════ FOOTER ═════════ */}
      <footer className="border-t py-20 relative" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.005)" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px opacity-30" style={{
          background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.3), transparent)"
        }} />
        <div className="section-container max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <LogoMark size={22} />
                <span className="font-semibold text-white text-lg tracking-tight">NOCTRA</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#7a7390" }}>
                The observatory for shipping. Know your launch readiness before you push to prod.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-5">Product</h4>
              <ul className="space-y-3.5">
                {["Features","Pricing","Integrations","Changelog"].map((item) => (
                  <li key={item}>
                    <span className="text-sm transition-all duration-300 cursor-default relative group inline-block"
                      style={{ color: "#7a7390" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f5f0ff"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#7a7390"; }}>
                      {item}
                      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-aurora-400 group-hover:w-full transition-all duration-300" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-5">Company</h4>
              <ul className="space-y-3.5">
                {["About","Blog","Careers","Contact"].map((item) => (
                  <li key={item}>
                    <span className="text-sm transition-all duration-300 cursor-default relative group inline-block"
                      style={{ color: "#7a7390" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f5f0ff"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#7a7390"; }}>
                      {item}
                      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-aurora-400 group-hover:w-full transition-all duration-300" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-5">Legal</h4>
              <ul className="space-y-3.5">
                {["Privacy","Terms","Security"].map((item) => (
                  <li key={item}>
                    <span className="text-sm transition-all duration-300 cursor-default relative group inline-block"
                      style={{ color: "#7a7390" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f5f0ff"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#7a7390"; }}>
                      {item}
                      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-aurora-400 group-hover:w-full transition-all duration-300" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <p className="text-xs" style={{ color: "#4a4560" }}>© 2026 NOCTRA. All rights reserved.</p>
            <p className="text-xs" style={{ color: "#4a4560" }}>Ship with evidence.</p>
          </div>
        </div>
      </footer>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onSignIn={handleSignIn} onSignUp={handleSignUp} onDemo={handleDemo} />
    </div>
  );
}
