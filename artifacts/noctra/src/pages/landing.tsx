import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { supabaseConfigError } from "@/integrations/supabase/client";
import { MILESTONES } from "@/lib/progression";
import { Zap, ArrowRight, Loader2, Brain, Target, FlaskConical, Rocket, AlertTriangle, Lock, Code2, Terminal, Cpu, Workflow, CheckCircle, Star, Users, TrendingUp, Play, ChevronDown, Sparkles, BarChart3, Shield, GitBranch } from "lucide-react";

const AnimatedWorkflow = () => (
  <div className="relative w-full max-w-lg mx-auto">
    <div className="absolute inset-0 bg-gradient-to-r from-[var(--noctra-cyan)] via-[var(--noctra-violet)] to-[var(--noctra-cyan)] opacity-20 blur-3xl rounded-full" />
    <div className="relative bg-[var(--noctra-surface)] border border-[var(--noctra-border)] rounded-2xl p-6 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-[var(--noctra-rose)]" />
        <div className="w-3 h-3 rounded-full bg-[var(--noctra-amber)]" />
        <div className="w-3 h-3 rounded-full bg-[var(--noctra-emerald)]" />
        <span className="ml-2 text-xs text-[var(--noctra-text-muted)]">Noctra Analysis Engine</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--noctra-surface2)] border border-[var(--noctra-border)] animate-pulse">
          <div className="w-8 h-8 rounded-lg bg-[rgba(61,216,255,0.15)] flex items-center justify-center">
            <Target size={14} style={{ color: "var(--noctra-cyan)" }} />
          </div>
          <div className="flex-1">
            <div className="h-2 w-24 rounded bg-[var(--noctra-cyan)] opacity-40 mb-1" />
            <div className="h-2 w-32 rounded bg-[var(--noctra-text-muted)] opacity-20" />
          </div>
          <div className="w-16 h-6 rounded bg-[var(--noctra-emerald)] opacity-60" />
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--noctra-surface2)] border border-[var(--noctra-border)]">
          <div className="w-8 h-8 rounded-lg bg-[rgba(244,63,94,0.15)] flex items-center justify-center">
            <Brain size={14} style={{ color: "var(--noctra-rose)" }} />
          </div>
          <div className="flex-1">
            <div className="h-2 w-28 rounded bg-[var(--noctra-rose)] opacity-40 mb-1" />
            <div className="h-2 w-20 rounded bg-[var(--noctra-text-muted)] opacity-20" />
          </div>
          <div className="w-16 h-6 rounded bg-[var(--noctra-amber)] opacity-60" />
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--noctra-surface2)] border border-[var(--noctra-border)]">
          <div className="w-8 h-8 rounded-lg bg-[rgba(149,117,255,0.15)] flex items-center justify-center">
            <Code2 size={14} style={{ color: "var(--noctra-violet)" }} />
          </div>
          <div className="flex-1">
            <div className="h-2 w-32 rounded bg-[var(--noctra-violet)] opacity-40 mb-1" />
            <div className="h-2 w-24 rounded bg-[var(--noctra-text-muted)] opacity-20" />
          </div>
          <div className="w-16 h-6 rounded bg-[var(--noctra-cyan)] opacity-60" />
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--noctra-surface2)] border border-[var(--noctra-cyan)]">
          <div className="w-8 h-8 rounded-lg bg-[rgba(61,216,255,0.2)] flex items-center justify-center">
            <Rocket size={14} style={{ color: "var(--noctra-cyan)" }} />
          </div>
          <div className="flex-1">
            <div className="h-2 w-20 rounded bg-[var(--noctra-cyan)] mb-1" />
            <div className="h-2 w-28 rounded bg-[var(--noctra-text-muted)] opacity-20" />
          </div>
          <div className="w-6 h-6 rounded-full bg-[var(--noctra-cyan)] flex items-center justify-center">
            <CheckCircle size={12} className="text-black" />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--noctra-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={12} style={{ color: "var(--noctra-cyan)" }} />
          <span className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>Analysis complete</span>
        </div>
        <span className="text-xs font-mono" style={{ color: "var(--noctra-emerald)" }}>12s</span>
      </div>
    </div>
  </div>
);

const stats = [
  { value: "10K+", label: "Projects Analyzed" },
  { value: "87%", label: "Launch Success Rate" },
  { value: "4.9", label: "Developer Rating" },
  { value: "50ms", label: "Avg Analysis Time" },
];

const integrations = [
  { name: "Cursor", icon: "⎔" },
  { name: "Replit", icon: "⏵" },
  { name: "Windsurf", icon: "≋" },
  { name: "VS Code", icon: "⬡" },
  { name: "GitHub", icon: "⎇" },
];

const testimonials = [
  { quote: "Noctra cut our validation time from weeks to hours. The Idea Checker alone saved us months of building the wrong thing.", author: "Sarah Chen", role: "Founder, TechStart" },
  { quote: "Project Doctor found 23 critical bugs we would have shipped. This tool is now part of our CI/CD pipeline.", author: "Marcus Johnson", role: "CTO, DevFlow" },
  { quote: "The execution plan generated was so detailed we just copied it directly into our sprint. Unreal productivity.", author: "Alex Rivera", role: "PM, ScaleUp" },
];

export default function LandingPage() {
  const { signIn, signUp, signInAnon, signInDemo, user } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const supabaseReady = !supabaseConfigError;

  useEffect(() => {
    if (user) {
      navigate("/app");
    }
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMsg("");
    if (!supabaseReady) {
      setError(supabaseConfigError ?? "Supabase is not configured.");
      return;
    }
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
    if (!supabaseReady) {
      setLoading(false);
      setError(supabaseConfigError ?? "Supabase is not configured.");
      return;
    }
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
    { icon: Target, label: "Validate Your Idea", desc: "Get a signal score, weak points, and your next validation step in seconds", color: "var(--noctra-cyan)" },
    { icon: Brain, label: "Diagnose Your Codebase", desc: "Upload your repo ZIP — get launch blockers, fix tasks, and a build prompt", color: "var(--noctra-rose)" },
    { icon: FlaskConical, label: "Generate Execution Plan", desc: "Turn analysis into prioritized tasks and an MVP build plan", color: "var(--noctra-violet)" },
    { icon: Rocket, label: "Know What to Build Next", desc: "From idea validation to launch — one clear next action", color: "var(--noctra-emerald)" },
  ];

  const howItWorks = [
    { step: "01", title: "Input Your Idea", desc: "Describe your product vision or upload your codebase" },
    { step: "02", title: "AI Analysis", desc: "Our intelligence engine scores, validates, and finds gaps" },
    { step: "03", title: "Get Your Plan", desc: "Receive prioritized tasks and a copy-paste build prompt" },
    { step: "04", title: "Execute & Launch", desc: "Ship faster with clear next actions and risk warnings" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--noctra-bg)" }}>
      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ borderColor: "var(--noctra-border)", background: "rgba(8,9,11,0.8)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--noctra-cyan)", boxShadow: "0 0 20px rgba(61,216,255,0.3)" }}>
              <Zap size={18} className="text-black" />
            </div>
            <span className="font-bold text-lg tracking-wide" style={{ color: "var(--noctra-text)" }}>NOCTRA</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--noctra-text-soft)" }}>Features</a>
            <a href="#how-it-works" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--noctra-text-soft)" }}>How It Works</a>
            <a href="#testimonials" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--noctra-text-soft)" }}>Testimonials</a>
            <button onClick={() => navigate("/pricing")} className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--noctra-text-soft)" }}>Pricing</button>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => { setTab("login"); document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" }); }} className="text-sm px-4 py-2 rounded-lg transition-opacity hover:opacity-80" style={{ color: "var(--noctra-text-soft)" }}>
              Sign in
            </button>
            <button onClick={() => { setTab("signup"); document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" }); }} className="text-sm px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90" style={{ background: "var(--noctra-cyan)", color: "#000" }}>
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--noctra-cyan)] opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[var(--noctra-violet)] opacity-10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[var(--noctra-cyan)] opacity-5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs mb-6" style={{ background: "rgba(61,216,255,0.08)", border: "1px solid rgba(61,216,255,0.2)", color: "var(--noctra-cyan)" }}>
              <Sparkles size={12} />
              <span>AI-Powered Development Intelligence</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6" style={{ color: "var(--noctra-text)" }}>
              Turn your idea into a<br />
              <span style={{ background: "linear-gradient(135deg, var(--noctra-cyan), var(--noctra-violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>launch-ready execution plan.</span>
            </h1>
            <p className="text-xl max-w-2xl mx-auto mb-8 leading-relaxed" style={{ color: "var(--noctra-text-soft)" }}>
              Validate ideas, diagnose codebases, and generate actionable plans in seconds. 
              Stop building in the dark — know exactly what to ship and when.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => { setTab("signup"); document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" }); }} className="px-8 py-4 rounded-xl text-base font-semibold flex items-center gap-2 transition-all hover:scale-105" style={{ background: "var(--noctra-cyan)", color: "#000", boxShadow: "0 0 30px rgba(61,216,255,0.3)" }}>
                <Play size={16} />
                Start Free Analysis
              </button>
              <button onClick={handleDemo} className="px-8 py-4 rounded-xl text-base font-medium flex items-center gap-2 transition-all hover:bg-white/5" style={{ background: "var(--noctra-surface)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}>
                <Sparkles size={16} />
                Try Demo Mode
              </button>
            </div>
          </div>

          {/* Animated Demo */}
          <div className="mt-16">
            <AnimatedWorkflow />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y" style={{ borderColor: "var(--noctra-border)", background: "var(--noctra-surface)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl font-bold mb-1" style={{ color: "var(--noctra-cyan)" }}>{stat.value}</p>
                <p className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--noctra-cyan)" }}>Intelligence Suite</p>
            <h2 className="text-4xl font-bold mb-4" style={{ color: "var(--noctra-text)" }}>Everything you need to ship faster</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--noctra-text-soft)" }}>
              From idea validation to launch readiness — a complete toolkit for developers who want to build the right thing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="group p-6 rounded-2xl border transition-all hover:scale-[1.02]" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--noctra-text)" }}>{label}</h3>
                <p className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 border-t" style={{ borderColor: "var(--noctra-border)", background: "var(--noctra-surface)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--noctra-violet)" }}>The Workflow</p>
            <h2 className="text-4xl font-bold mb-4" style={{ color: "var(--noctra-text)" }}>From idea to execution in 4 steps</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map(({ step, title, desc }, i) => (
              <div key={step} className="relative">
                <div className="p-6 rounded-2xl h-full" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                  <span className="text-6xl font-bold opacity-10" style={{ color: "var(--noctra-cyan)" }}>{step}</span>
                  <h3 className="text-lg font-semibold mt-2 mb-2" style={{ color: "var(--noctra-text)" }}>{title}</h3>
                  <p className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>{desc}</p>
                </div>
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight size={16} style={{ color: "var(--noctra-text-muted)" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--noctra-text-muted)" }}>Works with your stack</p>
            <div className="flex items-center justify-center gap-8 mt-6">
              {integrations.map(({ name, icon }) => (
                <div key={name} className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: "var(--noctra-surface)", border: "1px solid var(--noctra-border)" }}>
                  <span className="text-xl">{icon}</span>
                  <span className="text-sm font-medium" style={{ color: "var(--noctra-text-soft)" }}>{name}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-center text-sm" style={{ color: "var(--noctra-text-muted)" }}>
            Copy-paste the generated build prompts directly into your IDE
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 border-t" style={{ borderColor: "var(--noctra-border)", background: "var(--noctra-surface)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--noctra-emerald)" }}>Testimonials</p>
            <h2 className="text-4xl font-bold mb-4" style={{ color: "var(--noctra-text)" }}>Loved by developers</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ quote, author, role }, i) => (
              <div key={i} className="p-6 rounded-2xl" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} fill="var(--noctra-gold)" style={{ color: "var(--noctra-gold)" }} />
                  ))}
                </div>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--noctra-text-soft)" }}>"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "var(--noctra-cyan)", color: "#000" }}>
                    {author[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>{author}</p>
                    <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--noctra-cyan)] opacity-5 to-[var(--noctra-violet)] opacity-5" />
        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl font-bold mb-4" style={{ color: "var(--noctra-text)" }}>Ready to ship smarter?</h2>
          <p className="text-lg mb-8" style={{ color: "var(--noctra-text-soft)" }}>
            Join thousands of developers who stopped guessing and started building with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => { setTab("signup"); document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" }); }} className="px-8 py-4 rounded-xl text-base font-semibold flex items-center gap-2 transition-all hover:scale-105" style={{ background: "var(--noctra-cyan)", color: "#000", boxShadow: "0 0 30px rgba(61,216,255,0.3)" }}>
              Start Free — No Credit Card
            </button>
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth" className="py-20 px-6 border-t" style={{ borderColor: "var(--noctra-border)" }}>
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl border p-8" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
            {supabaseConfigError ? (
              <div className="flex items-start gap-2 px-4 py-3 rounded-lg mb-6 text-sm" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
                <AlertTriangle size={16} style={{ color: "var(--noctra-amber)", flexShrink: 0 }} />
                <div>
                  <p className="font-medium mb-1" style={{ color: "var(--noctra-amber)" }}>Database not connected</p>
                  <p style={{ color: "var(--noctra-text-muted)" }}>{supabaseConfigError}</p>
                  <p style={{ color: "var(--noctra-text-muted)" }}>Use <strong style={{ color: "var(--noctra-text-soft)" }}>Demo mode</strong> to explore.</p>
                </div>
              </div>
            ) : null}

            <div className="flex rounded-lg p-1 mb-6 gap-1" style={{ background: "var(--noctra-surface2)" }}>
              {(["login", "signup"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(""); setMsg(""); }}
                  className="flex-1 py-2 rounded-md text-sm font-medium transition-all"
                  style={tab === t ? { background: "var(--noctra-cyan)", color: "#000" } : { color: "var(--noctra-text-soft)" }}
                >
                  {t === "login" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email" required autoComplete="email" disabled={!supabaseReady || loading}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
              />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" required minLength={6}
                autoComplete={tab === "login" ? "current-password" : "new-password"} disabled={!supabaseReady || loading}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
              />
              {error && <p className="text-sm" style={{ color: "var(--noctra-rose)" }}>{error}</p>}
              {msg && <p className="text-sm" style={{ color: "var(--noctra-emerald)" }}>{msg}</p>}
              <button
                type="submit" disabled={loading || !supabaseReady}
                className="w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
                style={{ background: "var(--noctra-cyan)", color: "#000", opacity: loading ? 0.6 : 1 }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                {tab === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAnon} disabled={loading || !supabaseReady}
                className="flex-1 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)", opacity: loading ? 0.5 : 1 }}
              >
                Quick access
              </button>
              <button
                onClick={handleDemo} disabled={loading}
                className="flex-1 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)", opacity: loading ? 0.5 : 1 }}
              >
                Demo mode
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Progression path */}
      <div className="border-t px-6 py-12" style={{ borderColor: "var(--noctra-border)" }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-center mb-6" style={{ color: "var(--noctra-text-muted)" }}>
            Tools unlock as you make progress
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-xl p-4 text-center border" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(61,216,255,0.12)" }}>
                <Zap size={16} style={{ color: "var(--noctra-cyan)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>Start Here</p>
              <p className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>Idea Checker + Core</p>
            </div>
            {MILESTONES.map((m) => (
              <div key={m.key} className="rounded-xl p-4 text-center border" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                <Lock size={16} className="mx-auto mb-3" style={{ color: "var(--noctra-text-muted)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>{m.label}</p>
                <p className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>{m.description}</p>
                <p className="text-xs mt-2 font-mono" style={{ color: "var(--noctra-cyan)" }}>{m.requiredReports} reports</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t px-6 py-8" style={{ borderColor: "var(--noctra-border)", background: "var(--noctra-surface)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--noctra-cyan)" }}>
              <Zap size={12} className="text-black" />
            </div>
            <span className="font-bold" style={{ color: "var(--noctra-text)" }}>NOCTRA</span>
          </div>
          <p className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>
            © 2026 Noctra. Built for developers who ship.
          </p>
        </div>
      </footer>
    </div>
  );
}