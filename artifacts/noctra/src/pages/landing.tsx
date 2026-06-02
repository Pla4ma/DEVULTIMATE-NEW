import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { supabaseConfigError } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowUpRight, Quote } from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { StarfieldCanvas } from "@/components/StarfieldCanvas";
import { VoidButton } from "@/components/VoidButton";
import { VoidCard } from "@/components/VoidCard";
import { Appear } from "@/components/Appear";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { HeroSection } from "./landing/HeroSection";
import { FeaturesSection } from "./landing/FeaturesSection";
import { HowItWorksSection } from "./landing/HowItWorksSection";
import { AuthModal } from "./landing/AuthModal";
import { testimonials, integrations } from "./landing/landing-data";

export default function LandingPage() {
  const { signIn, signUp, signInDemo, user } = useAuth();
  const [, navigate] = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const supabaseReady = !supabaseConfigError;

  useEffect(() => {
    if (user) navigate("/app");
  }, [user, navigate]);

  function openAuth() {
    setShowAuth(true);
  }

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
    <div className="min-h-screen bg-void-0 text-text-primary relative">
      <StarfieldCanvas />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-void-3 bg-void-0/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Logo size={30} animated />
          </motion.div>
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              How It Works
            </a>
            <button
              onClick={() => navigate("/pricing")}
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              Pricing
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <VoidButton variant="ghost" size="sm" onClick={() => setShowAuth(true)}>
              Sign in
            </VoidButton>
            <VoidButton variant="primary" size="sm" onClick={openAuth}>
              Get Started <ArrowUpRight size={14} />
            </VoidButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <HeroSection onSignup={openAuth} onDemo={handleDemo} />

      {/* Signal Strip */}
      <section className="py-10 border-y border-void-3 bg-void-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p
            className="text-center text-xs tracking-[0.12em] uppercase mb-6"
            style={{ color: "var(--text-quaternary)" }}
          >
            Fix prompts that paste straight into your AI IDE
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {integrations.map((ig) => (
              <div
                key={ig.name}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-void-2 border border-void-3"
              >
                <span className="text-lg">{ig.icon}</span>
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {ig.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <FeaturesSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Testimonials */}
      <section className="py-[var(--spacing-section)] px-4 sm:px-6 border-t border-void-3">
        <div className="max-w-7xl mx-auto">
          <Appear>
            <p
              className="text-xs font-medium tracking-[0.12em] uppercase mb-4 text-center"
              style={{ color: "var(--signal-amber)" }}
            >
              From the observatory
            </p>
          </Appear>
          <Appear delay={0.1}>
            <h2
              className="font-bold tracking-tight mb-12 text-center"
              style={{
                color: "var(--text-primary)",
                fontSize: "clamp(1.7rem, 3vw, 2.4rem)",
              }}
            >
              Builders who shipped with evidence
            </h2>
          </Appear>

          <StaggerContainer className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <StaggerItem key={i}>
                <VoidCard className="flex flex-col gap-4 h-full">
                  <Quote size={18} style={{ color: "var(--signal-amber)", opacity: 0.6 }} />
                  <p
                    className="text-sm leading-relaxed flex-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {t.quote}
                  </p>
                  <div className="pt-4 border-t border-void-3">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {t.author}
                    </p>
                    <p
                      className="text-xs mt-0.5 tracking-wide uppercase"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {t.role}
                    </p>
                  </div>
                </VoidCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[var(--spacing-section)] px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center relative">
          <Appear>
            <div className="flex justify-center mb-6">
              <LogoMark size={44} animated />
            </div>
          </Appear>
          <Appear delay={0.1}>
            <h2
              className="font-bold tracking-tight mb-4"
              style={{
                color: "var(--text-primary)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
              }}
            >
              Point the observatory at your next launch.
            </h2>
          </Appear>
          <Appear delay={0.2}>
            <p
              className="text-lg mb-9 max-w-xl mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              Join the builders who catch launch blockers before they ship —
              with evidence, not hope.
            </p>
          </Appear>
          <Appear delay={0.3}>
            <VoidButton variant="primary" size="lg" onClick={openAuth}>
              Start free — no credit card <ArrowUpRight size={17} />
            </VoidButton>
          </Appear>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-void-3 px-4 sm:px-6 py-10 bg-void-1">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <Logo size={26} />
          <div className="flex items-center gap-4">
            <a
              href="/privacy"
              className="text-xs transition-opacity hover:opacity-80"
              style={{ color: "var(--text-tertiary)" }}
            >
              Privacy
            </a>
            <span style={{ color: "var(--text-quaternary)" }}>·</span>
            <a
              href="/pricing"
              className="text-xs transition-opacity hover:opacity-80"
              style={{ color: "var(--text-tertiary)" }}
            >
              Pricing
            </a>
          </div>
          <p
            className="text-xs font-mono"
            style={{ color: "var(--text-tertiary)" }}
          >
            © 2026 NOCTRA · Ship with evidence.
          </p>
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
