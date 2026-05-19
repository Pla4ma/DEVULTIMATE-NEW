import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { supabaseConfigError } from "@/integrations/supabase/client";
import { Zap, ArrowRight, Play, Sparkles, Star, Stethoscope, CheckCircle, Code, Terminal } from "lucide-react";
import { AnimatedWorkflow } from "./landing/AnimatedWorkflow";
import { LandingAuthSection } from "./landing/LandingAuthSection";
import { stats, integrations, testimonials, features, howItWorks } from "./landing/landing-data";

const ISSUE_CATEGORIES = [
  { label: "Security", issues: "Hardcoded secrets, exposed API keys, missing auth", color: "var(--noctra-rose)" },
  { label: "Deployment", issues: "No CI/CD, missing Dockerfile, port misconfiguration", color: "var(--noctra-amber)" },
  { label: "Testing", issues: "No test suite, low coverage, untested edge cases", color: "var(--noctra-violet)" },
  { label: "Code Quality", issues: "Dead code, anti-patterns, missing error handling", color: "var(--noctra-cyan)" },
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
    if (user) navigate("/app");
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMsg("");
    if (!supabaseReady) { setError(supabaseConfigError ?? "Supabase is not configured."); return; }
    setLoading(true);
    try {
      if (tab === "login") { await signIn(email, password); navigate("/app"); }
      else {
        const { needsEmailConfirmation } = await signUp(email, password);
        if (needsEmailConfirmation) setMsg("Check your email to confirm your account.");
        else navigate("/app");
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setLoading(false); }
  }

  async function handleAnon() {
    setError(""); setLoading(true);
    if (!supabaseReady) { setLoading(false); setError(supabaseConfigError ?? "Supabase is not configured."); return; }
    try { await signInAnon(); navigate("/app"); }
    catch (err) { setError(err instanceof Error ? err.message : "Anonymous login failed"); }
    finally { setLoading(false); }
  }

  async function handleDemo() {
    setError(""); setLoading(true);
    try { await signInDemo(); navigate("/app"); }
    catch (err) { setError(err instanceof Error ? err.message : "Demo mode failed"); }
    finally { setLoading(false); }
  }

  const scrollToAuth = () => document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--noctra-bg)" }}>
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ borderColor: "var(--noctra-border)", background: "rgba(8,9,11,0.8)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--noctra-cyan)", boxShadow: "0 0 20px rgba(61,216,255,0.3)" }}>
              <Zap size={18} className="text-black" />
            </div>
            <span className="font-bold text-lg tracking-wide" style={{ color: "var(--noctra-text)" }}>NOCTRA</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm hover:opacity-80" style={{ color: "var(--noctra-text-soft)" }}>Features</a>
            <a href="#how-it-works" className="text-sm hover:opacity-80" style={{ color: "var(--noctra-text-soft)" }}>How It Works</a>
            <a href="#testimonials" className="text-sm hover:opacity-80" style={{ color: "var(--noctra-text-soft)" }}>Testimonials</a>
            <button onClick={() => navigate("/pricing")} className="text-sm hover:opacity-80" style={{ color: "var(--noctra-text-soft)" }}>Pricing</button>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => { setTab("login"); scrollToAuth(); }} className="text-sm px-4 py-2 rounded-lg hover:opacity-80" style={{ color: "var(--noctra-text-soft)" }}>Sign in</button>
            <button onClick={() => { setTab("signup"); scrollToAuth(); }} className="text-sm px-4 py-2 rounded-lg font-medium hover:opacity-90" style={{ background: "var(--noctra-cyan)", color: "#000" }}>Get Started</button>
          </div>
        </div>
      </header>

      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--noctra-cyan)] opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[var(--noctra-violet)] opacity-10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[var(--noctra-cyan)] opacity-5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs mb-6" style={{ background: "rgba(61,216,255,0.08)", border: "1px solid rgba(61,216,255,0.2)", color: "var(--noctra-cyan)" }}>
              <Stethoscope size={12} />
              <span>Developer Intelligence OS</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6" style={{ color: "var(--noctra-text)" }}>
              Diagnose, validate, and ship<br />
              <span style={{ background: "linear-gradient(135deg, var(--noctra-cyan), var(--noctra-violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>with complete confidence.</span>
            </h1>
            <p className="text-xl max-w-2xl mx-auto mb-8 leading-relaxed" style={{ color: "var(--noctra-text-soft)" }}>
              Upload your codebase. Noctra scans for launch blockers, validates assumptions, and generates a prioritized execution plan — so you ship the right thing, the right way.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => { setTab("signup"); scrollToAuth(); }} className="px-8 py-4 rounded-xl text-base font-semibold flex items-center gap-2 transition-all hover:scale-105" style={{ background: "var(--noctra-cyan)", color: "#000", boxShadow: "0 0 30px rgba(61,216,255,0.3)" }}>
                <Play size={16} /> Start Free Analysis
              </button>
              <button onClick={handleDemo} className="px-8 py-4 rounded-xl text-base font-medium flex items-center gap-2 transition-all hover:bg-white/5" style={{ background: "var(--noctra-surface)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}>
                <Sparkles size={16} /> Try Demo Mode
              </button>
            </div>
          </div>
          <div className="mt-16"><AnimatedWorkflow /></div>
        </div>
      </section>

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

      <section className="py-24 px-6 border-t" style={{ borderColor: "var(--noctra-border)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--noctra-rose)" }}>Project Doctor</p>
            <h2 className="text-4xl font-bold mb-4" style={{ color: "var(--noctra-text)" }}>Your codebase has launch blockers.<br />Noctra finds them in seconds.</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--noctra-text-soft)" }}>
              Upload a ZIP of your repository. Noctra performs static analysis across your entire codebase, then generates a structured diagnostic report with prioritized fixes.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {ISSUE_CATEGORIES.map(({ label, issues, color }) => (
              <div key={label} className="rounded-xl p-5 border" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--noctra-text)" }}>{label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--noctra-text-muted)" }}>
                  <Code size={12} />
                  <span>{issues}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-xl border p-5" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)", borderStyle: "dashed" }}>
            <div className="flex items-center gap-3 text-sm mb-3" style={{ color: "var(--noctra-text-soft)" }}>
              <Terminal size={14} />
              <span className="font-mono text-xs" style={{ color: "var(--noctra-cyan)" }}>Your scan output</span>
            </div>
            <div className="space-y-2">
              {[
                { gate: "SECURITY", status: "RED", finding: "Hardcoded API key in config/secrets.ts:12" },
                { gate: "TESTING", status: "YELLOW", finding: "Test coverage at 23% — critical paths untested" },
                { gate: "DEPLOYMENT", status: "GREEN", finding: "Dockerfile and CI/CD configured" },
                { gate: "QUALITY", status: "RED", finding: "42 console.log statements in production code" },
              ].map(({ gate, status, finding }) => (
                <div key={gate} className="flex items-center gap-3 text-xs font-mono">
                  <span style={{
                    color: status === "RED" ? "var(--noctra-rose)" : status === "YELLOW" ? "var(--noctra-amber)" : "var(--noctra-emerald)",
                    fontWeight: 600,
                  }}>
                    [{status}]
                  </span>
                  <span style={{ color: "var(--noctra-text)", fontWeight: 500 }}>{gate}</span>
                  <span style={{ color: "var(--noctra-text-muted)" }}>{finding}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6 border-t" style={{ borderColor: "var(--noctra-border)", background: "var(--noctra-surface)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--noctra-cyan)" }}>Intelligence Suite</p>
            <h2 className="text-4xl font-bold mb-4" style={{ color: "var(--noctra-text)" }}>Everything you need to ship confidently</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--noctra-text-soft)" }}>From codebase diagnosis to launch readiness — a complete toolkit for developers who build products.</p>
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

      <section id="how-it-works" className="py-24 px-6 border-t" style={{ borderColor: "var(--noctra-border)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--noctra-violet)" }}>The Workflow</p>
            <h2 className="text-4xl font-bold mb-4" style={{ color: "var(--noctra-text)" }}>From idea to launch in 4 steps</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map(({ step, title, desc }, i) => (
              <div key={step} className="relative">
                <div className="p-6 rounded-2xl h-full" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                  <span className="text-6xl font-bold opacity-10" style={{ color: "var(--noctra-cyan)" }}>{step}</span>
                  <h3 className="text-lg font-semibold mt-2 mb-2" style={{ color: "var(--noctra-text)" }}>{title}</h3>
                  <p className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>{desc}</p>
                </div>
                {i < howItWorks.length - 1 && <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2"><ArrowRight size={16} style={{ color: "var(--noctra-text-muted)" }} /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6" style={{ background: "var(--noctra-surface)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--noctra-text-muted)" }}>Works with your stack</p>
            <div className="flex items-center justify-center gap-8 mt-6 flex-wrap">
              {integrations.map(({ name, icon }) => (
                <div key={name} className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: "var(--noctra-surface)", border: "1px solid var(--noctra-border)" }}>
                  <span className="text-xl">{icon}</span>
                  <span className="text-sm font-medium" style={{ color: "var(--noctra-text-soft)" }}>{name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs" style={{ color: "var(--noctra-text-muted)" }}>
            {["Idea Checker", "Project Doctor", "MVP Planner", "Launch Room"].map((tool) => (
              <div key={tool} className="flex items-center gap-1.5">
                <CheckCircle size={10} style={{ color: "var(--noctra-emerald)" }} />
                {tool}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-24 px-6 border-t" style={{ borderColor: "var(--noctra-border)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--noctra-emerald)" }}>Testimonials</p>
            <h2 className="text-4xl font-bold mb-4" style={{ color: "var(--noctra-text)" }}>Loved by developers</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ quote, author, role }, i) => (
              <div key={i} className="p-6 rounded-2xl" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <div className="flex gap-1 mb-4">{[...Array(5)].map((_, j) => (<Star key={j} size={14} fill="var(--noctra-gold)" style={{ color: "var(--noctra-gold)" }} />))}</div>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--noctra-text-soft)" }}>"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "var(--noctra-cyan)", color: "#000" }}>{author[0]}</div>
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

      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--noctra-cyan)] opacity-5 to-[var(--noctra-violet)] opacity-5" />
        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl font-bold mb-4" style={{ color: "var(--noctra-text)" }}>Ready to ship with confidence?</h2>
          <p className="text-lg mb-8" style={{ color: "var(--noctra-text-soft)" }}>Join thousands of developers who catch launch blockers before they ship.</p>
          <button onClick={() => { setTab("signup"); scrollToAuth(); }} className="px-8 py-4 rounded-xl text-base font-semibold transition-all hover:scale-105" style={{ background: "var(--noctra-cyan)", color: "#000", boxShadow: "0 0 30px rgba(61,216,255,0.3)" }}>
            Start Free — No Credit Card
          </button>
        </div>
      </section>

      <LandingAuthSection
        tab={tab} setTab={setTab} email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        loading={loading} error={error} msg={msg}
        supabaseConfigError={supabaseConfigError} supabaseReady={supabaseReady}
        onSubmit={handleSubmit} onAnon={handleAnon} onDemo={handleDemo}
      />

      <footer className="border-t px-6 py-8" style={{ borderColor: "var(--noctra-border)", background: "var(--noctra-surface)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--noctra-cyan)" }}>
              <Zap size={12} className="text-black" />
            </div>
            <span className="font-bold" style={{ color: "var(--noctra-text)" }}>NOCTRA</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="text-xs hover:opacity-80" style={{ color: "var(--noctra-text-muted)" }}>Repo Privacy</a>
            <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>·</span>
            <a href="/pricing" className="text-xs hover:opacity-80" style={{ color: "var(--noctra-text-muted)" }}>Pricing</a>
          </div>
          <p className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>© 2026 Noctra. Built for developers who ship.</p>
        </div>
      </footer>
    </div>
  );
}
