import { motion } from "framer-motion";
import {
  BrainCircuit,
  Stethoscope,
  Target,
  CheckSquare,
  RotateCcw,
  Brain,
  Rocket,
  Zap,
  GitBranch,
  Shield,
  FileCode,
  BarChart3,
  Activity,
  Lock,
} from "lucide-react";
import { BentoTile } from "@/components/effects/BentoTile";

interface Feature {
  icon: any;
  title: string;
  desc: string;
  accent: "violet" | "fuchsia" | "cyan" | "pink";
  className: string;
  visual: "score" | "blockers" | "graph" | "code" | "shield" | "tasks";
  metric: string;
  metricLabel: string;
}

const FEATURES: Feature[] = [
  {
    icon: Stethoscope,
    title: "AI Launch Readiness Scan",
    desc: "Upload your repo or point us at GitHub. Get an evidence-backed launch score, RED/YELLOW/GREEN gates, and prioritized fix tasks in under 2 minutes.",
    accent: "violet",
    className: "bento-2x2",
    visual: "score",
    metric: "87%",
    metricLabel: "accuracy",
  },
  {
    icon: Target,
    title: "Blocker Detection",
    desc: "Every finding includes file-level evidence. Know exactly what blocks launch and where to fix it.",
    accent: "fuchsia",
    className: "bento-1x1",
    visual: "blockers",
    metric: "12",
    metricLabel: "found",
  },
  {
    icon: BrainCircuit,
    title: "Codebase Intelligence",
    desc: "AI predicts 6 months of technical debt. Fix issues before they become emergencies.",
    accent: "cyan",
    className: "bento-1x1",
    visual: "graph",
    metric: "6mo",
    metricLabel: "forecast",
  },
  {
    icon: CheckSquare,
    title: "Fix Task Generation",
    desc: "Every blocker becomes a prioritized task. Fix, then rescan to verify your score improved.",
    accent: "violet",
    className: "bento-1x1",
    visual: "tasks",
    metric: "<2min",
    metricLabel: "to fix",
  },
  {
    icon: Zap,
    title: "AI-Generated Fix Prompts",
    desc: "Don't just see problems — get specific prompts you can paste into Cursor or Copilot to resolve blockers immediately.",
    accent: "pink",
    className: "bento-2x1",
    visual: "code",
    metric: "1-click",
    metricLabel: "export",
  },
  {
    icon: RotateCcw,
    title: "Rescan Improvement Loop",
    desc: "Track launch readiness over time. Each scan shows progress, improvements, and what's still blocking you from shipping.",
    accent: "cyan",
    className: "bento-1x1",
    visual: "shield",
    metric: "+34",
    metricLabel: "avg lift",
  },
];

export function BentoFeatures() {
  return (
    <section
      id="features"
      className="py-28 lg:py-36 relative overflow-hidden scroll-anchor"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-30 section-dots"
        style={{ maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="absolute top-0 left-1/4 -z-10 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute bottom-0 right-1/4 -z-10 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,0.4) 0%, transparent 70%)",
        }}
      />

      <div className="section-container max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="eyebrow mb-5">Features</p>
          <h2
            className="font-bold text-white mb-6 tracking-[-0.04em] leading-[1.02] text-balance"
            style={{ fontSize: "clamp(2.5rem, 5.5vw, 4rem)" }}
          >
            Intelligence that{" "}
            <span className="text-gradient-aurora">pays for itself</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed text-pretty" style={{ color: "#7a7390" }}>
            Six tools designed to help you ship faster, catch blockers earlier, and
            launch with evidence — every single time.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[minmax(220px,auto)] gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className={f.className}
            >
              <BentoTile accent={f.accent} className="h-full">
                <div className="p-6 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="icon-chip"
                      style={{ width: 48, height: 48 }}
                    >
                      <f.icon size={20} style={{ color: "#c084fc" }} />
                    </div>
                    <div
                      className="text-right"
                    >
                      <p
                        className="text-2xl font-bold tracking-tight leading-none"
                        style={{
                          background: "linear-gradient(135deg, #f5f0ff 0%, #c084fc 100%)",
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {f.metric}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: "#7a7390" }}>
                        {f.metricLabel}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2 text-balance">
                    {f.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed mb-4 flex-1"
                    style={{ color: "#b4aec8" }}
                  >
                    {f.desc}
                  </p>

                  <FeatureVisual kind={f.visual} accent={f.accent} />
                </div>
              </BentoTile>
            </motion.div>
          ))}
        </div>

        {/* Sub-features row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { icon: Brain, label: "Idea Validation" },
            { icon: Rocket, label: "Launch Workflow" },
            { icon: GitBranch, label: "Project Memory" },
            { icon: Shield, label: "Security Scan" },
            { icon: FileCode, label: "Codebase Health" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#b4aec8",
              }}
            >
              <s.icon size={13} style={{ color: "#c084fc" }} />
              <span className="font-medium">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FeatureVisual({
  kind,
  accent,
}: {
  kind: "score" | "blockers" | "graph" | "code" | "shield" | "tasks";
  accent: "violet" | "fuchsia" | "cyan" | "pink";
}) {
  const colorMap = {
    violet: "#a855f7",
    fuchsia: "#e879f9",
    cyan: "#22d3ee",
    pink: "#f472b6",
  };
  const c = colorMap[accent];

  if (kind === "score") {
    return (
      <div className="mt-2 grid grid-cols-3 gap-2">
        {[
          { l: "Score", v: "87", color: c },
          { l: "Blockers", v: "3", color: "#ef4444" },
          { l: "Tasks", v: "8", color: "#22d3ee" },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-lg p-2"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
          >
            <p className="text-[8px] uppercase tracking-wider" style={{ color: "#7a7390" }}>{m.l}</p>
            <p className="text-lg font-bold" style={{ color: m.color }}>{m.v}</p>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "blockers") {
    return (
      <div className="mt-2 space-y-1.5">
        {[
          { t: "API key in config", c: "#ef4444" },
          { t: "Rate-limit missing", c: "#eab308" },
        ].map((b) => (
          <div key={b.t} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: b.c, boxShadow: `0 0 6px ${b.c}` }} />
            <span className="text-[11px] truncate" style={{ color: "#b4aec8" }}>{b.t}</span>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "graph") {
    return (
      <div className="mt-2 flex items-end gap-[2px] h-12">
        {[20, 30, 25, 40, 35, 50, 45, 60, 55, 70, 65, 80].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${h}%`,
              background: i >= 8 ? `linear-gradient(180deg, ${c}, #7c3aed)` : `${c}30`,
              boxShadow: i >= 8 ? `0 0 6px ${c}80` : "none",
            }}
          />
        ))}
      </div>
    );
  }
  if (kind === "code") {
    return (
      <div
        className="mt-2 rounded-lg p-2.5 font-mono text-[10px] leading-relaxed"
        style={{
          background: "rgba(3,0,10,0.6)",
          border: "1px solid rgba(168,85,247,0.15)",
        }}
      >
        <p><span style={{ color: "#7a7390" }}>// fix prompt for cursor</span></p>
        <p><span style={{ color: "#e879f9" }}>const</span> <span style={{ color: "#22d3ee" }}>fix</span> = () ={">"} {"{"}</p>
        <p className="pl-3"><span style={{ color: "#a855f7" }}>move</span> keys → <span style={{ color: "#22c55e" }}>.env</span>;</p>
        <p className="pl-3"><span style={{ color: "#a855f7" }}>add</span> rate-limit; </p>
        <p>{"}"}</p>
      </div>
    );
  }
  if (kind === "shield") {
    return (
      <div className="mt-2 flex items-center gap-3">
        <div className="relative">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${c}30, transparent)`, border: `1px solid ${c}40` }}
          >
            <Lock size={16} style={{ color: c }} />
          </div>
          <span
            className="absolute inset-0 rounded-full animate-pulse-ring"
            style={{ border: `1px solid ${c}` }}
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-white">Scan #14</p>
          <p className="text-[10px]" style={{ color: "#7a7390" }}>+34 pts improved</p>
        </div>
      </div>
    );
  }
  if (kind === "tasks") {
    return (
      <div className="mt-2 space-y-1">
        {[
          { t: "Add auth middleware", d: true },
          { t: "Fix CORS headers", d: true },
          { t: "Add error boundary", d: false },
        ].map((task, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded border flex items-center justify-center"
              style={{
                background: task.d ? c : "transparent",
                borderColor: task.d ? c : "rgba(255,255,255,0.2)",
              }}
            >
              {task.d && <CheckSquare size={8} className="text-void-0" />}
            </div>
            <span
              className="text-[10px] flex-1"
              style={{
                color: task.d ? "#4a4560" : "#b4aec8",
                textDecoration: task.d ? "line-through" : "none",
              }}
            >
              {task.t}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}
