import { motion } from "framer-motion";
import { ArrowRight, Rocket, Sparkles, Zap } from "lucide-react";
import { Magnetic } from "@/components/effects/Magnetic";
import { BeamButton } from "@/components/effects/BeamButton";
import { LiquidOrb } from "@/components/effects/LiquidOrb";
import { MeteorShower } from "@/components/effects/MeteorShower";

export function FinalCta({ onCta }: { onCta: () => void }) {
  return (
    <section className="py-24 lg:py-32 relative scroll-anchor">
      <div className="section-container max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl cta-banner-bg"
        >
          {/* Decorative orbs */}
          <LiquidOrb size={400} className="-top-32 -left-32 opacity-60" blur={80} />
          <LiquidOrb size={350} className="-bottom-32 -right-20 opacity-50" blur={80} delay={2} />
          <MeteorShower count={6} className="opacity-40" />

          {/* Inner content */}
          <div className="relative z-10 px-8 py-20 lg:px-16 lg:py-28 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest mb-6"
              style={{
                background: "rgba(168,85,247,0.1)",
                border: "1px solid rgba(168,85,247,0.2)",
                color: "#c084fc",
              }}
            >
              <Sparkles size={11} />
              Ready to ship with evidence?
            </motion.div>

            <h2
              className="font-bold text-white mb-6 tracking-[-0.04em] leading-[0.98] text-balance"
              style={{ fontSize: "clamp(2.75rem, 6.5vw, 5.5rem)" }}
            >
              Stop guessing.
              <br />
              <span className="headline-aurora">Start shipping.</span>
            </h2>

            <p
              className="text-lg max-w-xl mx-auto leading-relaxed mb-10 text-pretty"
              style={{ color: "#b4aec8" }}
            >
              Join 1,200+ builders who catch launch blockers before they ship —
              with evidence, not hope.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Magnetic strength={0.3}>
                <BeamButton
                  variant="primary"
                  size="lg"
                  onClick={onCta}
                  pulse
                  icon={<Rocket size={15} fill="currentColor" />}
                  iconRight={<ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
                >
                  Start your free launch scan
                </BeamButton>
              </Magnetic>
              <Magnetic strength={0.2}>
                <BeamButton
                  variant="ghost"
                  size="lg"
                  onClick={onCta}
                  icon={<Zap size={14} />}
                  className="text-text-secondary hover:text-white"
                >
                  Try demo mode
                </BeamButton>
              </Magnetic>
            </div>

            {/* Social proof line */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs"
              style={{ color: "#7a7390" }}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                1,200+ teams shipping
              </span>
              <span>·</span>
              <span>4.9★ on G2</span>
              <span>·</span>
              <span>SOC 2 Type II</span>
              <span>·</span>
              <span>14-day free trial</span>
            </motion.div>
          </div>

          {/* Edge highlight */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 30%, transparent 70%, rgba(168,85,247,0.1) 100%)",
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}
