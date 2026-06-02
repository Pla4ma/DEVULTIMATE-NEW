import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { supabaseConfigError } from "@/integrations/supabase/client";
import { SmoothScroll } from "@/components/effects/SmoothScroll";
import { ScrollProgress } from "@/components/effects/ScrollProgress";
import { Nav } from "./nav";
import { Hero } from "./hero";
import { TrustBar } from "./trust-bar";
import { Stats } from "./stats";
import { BentoFeatures } from "./bento-features";
import { Workflow } from "./workflow";
import { Pricing } from "./pricing";
import { Testimonials } from "./testimonials";
import { AuthSection } from "./auth-section";
import { FinalCta } from "./final-cta";
import { Footer } from "./footer";
import { AuthModal } from "./AuthModal";

export default function LandingPage() {
  const { signIn, signUp, signInAnon, signInDemo, user } = useAuth();
  const [, navigate] = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const supabaseReady = !supabaseConfigError;

  useEffect(() => {
    if (user) navigate("/app");
  }, [user, navigate]);

  async function handleSignIn(email: string, password: string) {
    if (!supabaseReady) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
    await signIn(email, password);
    navigate("/app");
  }

  async function handleSignUp(email: string, password: string) {
    if (!supabaseReady) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
    const result = await signUp(email, password);
    if (!result.needsEmailConfirmation) navigate("/app");
    return result;
  }

  async function handleAuthSubmit(email: string, password: string, isLogin: boolean) {
    if (isLogin) {
      await handleSignIn(email, password);
    } else {
      await handleSignUp(email, password);
    }
  }

  async function handleDemo() {
    await signInDemo();
    navigate("/app");
  }

  async function handleAnon() {
    await signInAnon();
    navigate("/app");
  }

  return (
    <div className="min-h-screen bg-void-0 text-text-primary overflow-x-clip">
      <SmoothScroll />
      <ScrollProgress />
      <Nav onCta={() => setShowAuth(true)} onSignIn={() => setShowAuth(true)} />

      <main>
        <Hero
          onCta={() => setShowAuth(true)}
          onSecondary={() =>
            document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
          }
        />
        <TrustBar />
        <Stats />
        <BentoFeatures />
        <Workflow />
        <Pricing onCta={() => setShowAuth(true)} />
        <Testimonials />
        <AuthSection
          onSubmit={handleAuthSubmit}
          onDemo={handleDemo}
          onAnon={handleAnon}
          supabaseReady={supabaseReady}
          supabaseConfigError={supabaseConfigError}
        />
        <FinalCta onCta={() => setShowAuth(true)} />
      </main>

      <Footer />

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
