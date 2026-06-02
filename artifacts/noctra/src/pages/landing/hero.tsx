import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Play, ChevronRight, Sparkles } from "lucide-react";
import { TextScramble } from "@/components/effects/TextScramble";
import { Magnetic } from "@/components/effects/Magnetic";
import { FloatingShapes } from "@/components/effects/FloatingShapes";
import { AuroraBackground } from "@/components/effects/AuroraBackground";
import { BeamButton } from "@/components/effects/BeamButton";
import { MeteorShower } from "@/components/effects/MeteorShower";
import { LogoMark } from "@/components/Logo";
import { DashboardMockup } from "./dashboard-mockup";

interface HeroProps {
  onCta: () => void;
  onSecondary: () => void;
}

const SCRAMBLE_WORDS = ["evidence", "confidence", "precision", "momentum"];

export function Hero({ onCta, onSecondary }: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % SCRAMBLE_WORDS.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      ref={ref}
      className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden scroll-anchor"
      id="top"
    >
      {/* Layered background */}
      <div className="absolute inset-0 -z-10">
        <AuroraBackground variant="intense" />
        <div className="absolute inset-0 hero-grid animate-hero-grid-pan opacity-50" />
        <div className="absolute inset-0 starfield animate-starfield-drift" />
        <FloatingShapes />
        <MeteorShower count={8} className="opacity-60" />
      </div>

      <motion.div
        style={{ y, opacity, scale }}
        className="section-container relative"
      >
        <div className="max-w-5xl mx-auto text-center mb-16">
          {/* Eyebrow chip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border mb-8 backdrop-blur-md"
            style={{
              borderColor: "rgba(168, 85, 247, 0.25)",
              background: "linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(232,121,249,0.04) 100%)",
            }}
          >
            <span className="relative flex items-center justify-center w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-aurora-400 animate-ping" />
              <span className="w-1.5 h-1.5 rounded-full bg-aurora-400" />
            </span>
            <span className="text-[11px] font-medium tracking-wide" style={{ color: "#c084fc" }}>
              AI-Powered Launch Intelligence · v2.0
            </span>
            <ChevronRight size={12} style={{ color: "#c084fc" }} />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="font-bold text-white mb-7 leading-[0.98] tracking-[-0.04em] text-balance"
            style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}
          >
            <span className="block">Ship with</span>
            <span className="block relative">
              <span className="text-gradient-aurora inline-block min-w-[3ch]">
                <TextScramble
                  text={SCRAMBLE_WORDS[wordIndex] ?? ""}
                  speed={22}
                  key={wordIndex}
                />
              </span>
              <span className="text-gradient-aurora">,</span>
            </span>
            <span className="block">not hope.</span>
          </motion.h1>

          {/* Hidden trigger to cycle words (autoplay every 3s) */}

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "#b4aec8" }}
          >
            Point NOCTRA at your codebase. Get a launch readiness score, prioritized
            blockers, and fix prompts you can paste straight into your AI IDE.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Magnetic strength={0.25}>
              <BeamButton
                variant="primary"
                size="lg"
                onClick={onCta}
                pulse
                icon={<Play size={14} fill="currentColor" />}
                iconRight={<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
              >
                Start your launch scan
              </BeamButton>
            </Magnetic>
            <Magnetic strength={0.2}>
              <BeamButton
                variant="secondary"
                size="lg"
                onClick={onSecondary}
                icon={<Sparkles size={14} />}
              >
                See how it works
              </BeamButton>
            </Magnetic>
          </motion.div>

          {/* Trust line under CTAs */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="text-xs mt-6"
            style={{ color: "#7a7390" }}
          >
            No credit card required · 14-day free trial · Setup in 2 minutes
          </motion.p>
        </div>

        {/* Dashboard Mockup */}
        <DashboardMockup />

        {/* Hero footer badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { icon: "✓", label: "GitHub", sub: "ready" },
            { icon: "✓", label: "ZIP upload", sub: "supported" },
            { icon: "✓", label: "Cursor", sub: "compatible" },
            { icon: "✓", label: "Copilot", sub: "compatible" },
          ].map((b) => (
            <div
              key={b.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#b4aec8",
              }}
            >
              <span className="text-aurora-400 font-mono">{b.icon}</span>
              <span className="font-medium">{b.label}</span>
              <span style={{ color: "#4a4560" }}>· {b.sub}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
