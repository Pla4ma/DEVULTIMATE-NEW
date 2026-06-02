import { motion } from "framer-motion";
import { Scan, Wrench, RotateCcw, Rocket, Upload, FileSearch, AlertTriangle, Check, Play, GitBranch, Sparkles, Terminal } from "lucide-react";
import { AnimatedWorkflow } from "./AnimatedWorkflow";

const STEPS = [
  {
    step: "01",
    icon: Scan,
    title: "Scan",
    short: "Drop your repo",
    long: "Upload a ZIP, paste a GitHub URL, or import from Cursor. We parse the structure, dependencies, security posture, and code quality in seconds.",
    accent: "#a855f7",
  },
  {
    step: "02",
    icon: Wrench,
    short: "Fix",
    long: "Our AI engine processes your codebase, identifies anti-patterns, and scores launch readiness based on real-world shipping data. Every blocker becomes a fix task.",
    accent: "#22d3ee",
  },
  {
    step: "03",
    icon: RotateCcw,
    short: "Rescan",
    long: "Run another scan to verify your score improved. Track launch readiness over time with every iteration — the rescan loop is where the magic happens.",
    accent: "#e879f9",
  },
  {
    step: "04",
    icon: Rocket,
    short: "Ship",
    long: "When all gates are green and your score is launch-ready, ship with confidence. No more guessing. No more surprises. Just evidence.",
    accent: "#22c55e",
  },
];

export function Workflow() {
  return (
    <section
      id="how-it-works"
      className="py-28 lg:py-36 relative overflow-hidden scroll-anchor"
      style={{
        background:
          "linear-gradient(180deg, transparent 0%, rgba(168,85,247,0.04) 50%, transparent 100%)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-20 section-dots"
        style={{ maskImage: "radial-gradient(ellipse 70% 50% at 50% 50%, black 0%, transparent 70%)" }}
      />

      <div className="section-container max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="eyebrow mb-5">How it works</p>
          <h2
            className="font-bold text-white mb-6 tracking-[-0.04em] leading-[1.02] text-balance"
            style={{ fontSize: "clamp(2.5rem, 5.5vw, 4rem)" }}
          >
            From code to launch in{" "}
            <span className="text-gradient-aurora">four moves</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#7a7390" }}>
            Idea → MVP → project → scan → fix → rescan → launch. A complete
            pipeline from concept to shipping, with evidence at every step.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Steps */}
          <div className="space-y-5">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="group relative flex gap-5 p-5 rounded-2xl transition-all duration-500"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(180deg, ${s.accent}, transparent)` }}
                />
                <div
                  className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${s.accent}20 0%, ${s.accent}05 100%)`,
                    border: `1px solid ${s.accent}30`,
                    boxShadow: `0 0 20px ${s.accent}15`,
                  }}
                >
                  <s.icon size={22} style={{ color: s.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span
                      className="text-xs font-mono font-bold tracking-wider"
                      style={{ color: s.accent }}
                    >
                      STEP {s.step}
                    </span>
                    <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#b4aec8" }}>
                    {s.long}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Animated workflow preview + integrations */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="space-y-6 sticky top-32"
          >
            <AnimatedWorkflow />

            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] font-mono mb-4" style={{ color: "#7a7390" }}>
                Paste prompts into your AI IDE
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "Cursor", icon: "⏶" },
                  { name: "Replit", icon: "⏵" },
                  { name: "Windsurf", icon: "≋" },
                  { name: "VS Code", icon: "⬡" },
                  { name: "GitHub Copilot", icon: "◉" },
                ].map((tool) => (
                  <div
                    key={tool.name}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#b4aec8",
                    }}
                  >
                    <span className="text-aurora-400 font-mono">{tool.icon}</span>
                    <span className="font-medium">{tool.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
