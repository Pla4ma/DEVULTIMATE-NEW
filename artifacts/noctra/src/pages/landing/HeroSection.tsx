import { motion } from "framer-motion";
import { ArrowUpRight, Play } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { VoidButton } from "@/components/VoidButton";

interface HeroSectionProps {
  onSignup: () => void;
  onDemo: () => void;
}

export function HeroSection({ onSignup, onDemo }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center pt-16 pb-28">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2.5 pl-3 pr-4 py-1.5 rounded-full mb-8 bg-void-1 border border-void-3"
          >
            <LogoMark size={18} animated />
            <span className="text-xs font-medium tracking-wide text-signal-amber">
              Launch Intelligence · Live
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="font-bold leading-[0.95] tracking-tight"
            style={{
              color: "var(--text-primary)",
              fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Ship with evidence,
            <br />
            <span className="text-signal-amber">not hope.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 text-lg sm:text-xl max-w-xl leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            NOCTRA is the observatory for shipping. Point it at your idea or
            your codebase and get a launch readiness score, prioritized
            blockers, and fix prompts you can paste straight into your AI IDE.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <VoidButton variant="primary" size="lg" onClick={onSignup}>
              <Play size={16} fill="currentColor" />
              Start free analysis
              <ArrowUpRight size={16} />
            </VoidButton>
            <VoidButton variant="secondary" size="lg" onClick={onDemo}>
              Explore demo mode
            </VoidButton>
          </motion.div>
        </div>
      </div>

      {/* Static Signal Tower silhouette */}
      <div className="absolute bottom-12 right-8 opacity-20 hidden lg:block">
        <svg width="200" height="300" viewBox="0 0 200 300" fill="none">
          <path
            d="M100 20L180 280H20L100 20Z"
            stroke="var(--signal-amber)"
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M100 20L140 200H60L100 20Z"
            stroke="var(--signal-amber)"
            strokeWidth="0.5"
            fill="none"
            opacity="0.3"
          />
          <line x1="100" y1="20" x2="100" y2="280" stroke="var(--signal-amber)" strokeWidth="0.5" opacity="0.2" />
        </svg>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-px h-12 bg-gradient-to-b from-signal-amber to-transparent opacity-60 animate-pulse" />
      </motion.div>
    </section>
  );
}
