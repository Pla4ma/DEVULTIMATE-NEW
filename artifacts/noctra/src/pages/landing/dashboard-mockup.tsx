import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Lock,
  Stethoscope,
  Brain,
  BarChart3,
  Settings,
  Gauge,
  Scan,
  Check,
  AlertTriangle,
  ChevronUp,
  Activity,
  Zap,
  TrendingUp,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { Tilt } from "@/components/effects/Tilt";

/**
 * DashboardMockup — realistic 5-panel launch-readiness mockup.
 * Cursor-tracked 3D tilt + ambient glow + scan line + animated metrics.
 */
export function DashboardMockup() {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), {
    stiffness: 150,
    damping: 20,
  });
  const rotY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 150,
    damping: 20,
  });
  const glareX = useTransform(mouseX, [-0.5, 0.5], ["20%", "80%"]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ["20%", "80%"]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Combine glareX and glareY into a single CSS background string via useTransform
  const glareBg = useTransform(
    [glareX, glareY],
    (values) => {
      const [x, y] = values as unknown as [string, string];
      return `radial-gradient(circle 350px at ${x} ${y}, rgba(192,132,252,0.18), transparent)`;
    }
  );

  function glareGradient() {
    return glareBg;
  }

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function reset() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto" onMouseMove={handleMove} onMouseLeave={reset}>
      {/* Ambient glow behind */}
      <div
        aria-hidden
        className="absolute -inset-32 -z-10 opacity-70 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(168,85,247,0.45) 0%, rgba(232,121,249,0.25) 30%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -top-20 left-1/4 -z-10 w-72 h-72 rounded-full opacity-30 blur-3xl animate-float-slow pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,0.6) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.92, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d", perspective: 1500 }}
        className="relative"
      >
        <Tilt intensity={3} className="relative">
          <motion.div
            className="relative rounded-2xl overflow-hidden stage-3d-card"
            style={{
              background:
                "linear-gradient(180deg, rgba(15,10,30,0.95) 0%, rgba(6,3,15,0.95) 100%)",
              border: "1px solid rgba(168, 85, 247, 0.18)",
              boxShadow:
                "0 60px 120px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 100px -20px rgba(168,85,247,0.4)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Gradient border glow */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(168,85,247,0.18) 0%, transparent 40%, transparent 60%, rgba(232,121,249,0.12) 100%)",
              }}
            />

            {/* Scan line */}
            <div className="scan-overlay" aria-hidden />

            {/* Window chrome */}
            <div
              className="flex items-center gap-3 px-5 py-3 border-b relative z-10"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#eab308" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
              </div>
              <div className="flex-1 flex justify-center">
                <div
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-mono"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#7a7390",
                  }}
                >
                  <Lock size={10} />
                  <span>app.noctra.dev/command-center</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded font-medium"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              </div>
            </div>

            {/* App content */}
            <div className="p-5 grid grid-cols-12 gap-3 relative z-10">
              {/* Sidebar */}
              <div className="col-span-2 space-y-1.5">
                <div className="flex items-center gap-2 px-2 py-2 mb-3">
                  <LogoMark size={22} />
                  <span className="text-[10px] font-bold tracking-[0.15em]" style={{ color: "#f5f0ff" }}>
                    NOCTRA
                  </span>
                </div>
                {[
                  { icon: Gauge, label: "Dashboard", active: true, badge: null },
                  { icon: Stethoscope, label: "Health Scan", active: false, badge: "3" },
                  { icon: Brain, label: "Project Brain", active: false, badge: null },
                  { icon: BarChart3, label: "Analytics", active: false, badge: null },
                  { icon: Scan, label: "Reports", active: false, badge: "12" },
                  { icon: Settings, label: "Settings", active: false, badge: null },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[10px] transition-all"
                    style={{
                      background: item.active
                        ? "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(232,121,249,0.06) 100%)"
                        : "transparent",
                      color: item.active ? "#e9d5ff" : "#7a7390",
                      border: item.active ? "1px solid rgba(168,85,247,0.25)" : "1px solid transparent",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon size={11} strokeWidth={item.active ? 2.2 : 1.5} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background: "rgba(239,68,68,0.15)",
                          color: "#f87171",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Main area */}
              <div className="col-span-10 space-y-3">
                {/* Top row — 4 metric cards */}
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    {
                      label: "LAUNCH SCORE",
                      value: "87",
                      suffix: "/100",
                      color: "#a855f7",
                      width: "87%",
                      trend: "+12",
                      icon: TrendingUp,
                    },
                    {
                      label: "BLOCKERS",
                      value: "3",
                      suffix: "critical",
                      color: "#ef4444",
                      width: "30%",
                      trend: "-2",
                      icon: AlertTriangle,
                    },
                    {
                      label: "FIX TASKS",
                      value: "8",
                      suffix: "queued",
                      color: "#22d3ee",
                      width: "60%",
                      trend: "+3",
                      icon: Check,
                    },
                    {
                      label: "RESCAN DELTA",
                      value: "+34",
                      suffix: "pts",
                      color: "#22c55e",
                      width: "85%",
                      trend: "↑",
                      icon: Activity,
                    },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className="rounded-xl p-3 relative overflow-hidden group"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div
                        aria-hidden
                        className="absolute inset-0 opacity-30 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at 50% 0%, ${card.color}20 0%, transparent 70%)`,
                        }}
                      />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <p
                            className="text-[8px] uppercase tracking-[0.15em] font-semibold"
                            style={{ color: "#7a7390" }}
                          >
                            {card.label}
                          </p>
                          <card.icon size={9} style={{ color: card.color }} />
                        </div>
                        <div className="flex items-end justify-between mb-1.5">
                          <div className="flex items-baseline gap-1">
                            <p className="text-2xl font-bold leading-none" style={{ color: card.color }}>
                              {card.value}
                            </p>
                            <span className="text-[8px]" style={{ color: "#4a4560" }}>
                              {card.suffix}
                            </span>
                          </div>
                          <span
                            className="text-[8px] font-mono px-1 py-0.5 rounded"
                            style={{ background: `${card.color}15`, color: card.color }}
                          >
                            {card.trend}
                          </span>
                        </div>
                        <div
                          className="w-full h-1 rounded-full overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: card.width,
                              background: `linear-gradient(90deg, ${card.color}, ${card.color}80)`,
                              boxShadow: `0 0 8px ${card.color}80`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Middle — chart area */}
                <div
                  className="rounded-xl p-3.5 relative overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <p className="text-[9px] uppercase tracking-[0.15em] font-semibold" style={{ color: "#b4aec8" }}>
                        Launch Readiness — 30 Day Trend
                      </p>
                      <span
                        className="text-[8px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1"
                        style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}
                      >
                        <ChevronUp size={8} /> +47%
                      </span>
                    </div>
                    <div className="flex gap-0.5">
                      {["1W", "1M", "3M", "6M", "1Y"].map((p, i) => (
                        <span
                          key={p}
                          className="text-[8px] px-1.5 py-0.5 rounded font-medium"
                          style={{
                            background: i === 2 ? "rgba(168,85,247,0.15)" : "transparent",
                            color: i === 2 ? "#c084fc" : "#4a4560",
                          }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end gap-[2px] h-20 px-1">
                    {[20, 28, 24, 32, 30, 38, 42, 45, 50, 48, 56, 60, 58, 65, 70, 68, 74, 78, 76, 82, 80, 85, 87].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm transition-all"
                          style={{
                            height: `${h}%`,
                            background:
                              i >= 18
                                ? "linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)"
                                : `rgba(168, 85, 247, ${0.08 + (i / 25) * 0.4})`,
                            boxShadow: i >= 18 ? "0 0 10px rgba(168,85,247,0.5)" : "none",
                            animation: mounted
                              ? `slideUp 0.6s ${i * 0.03}s cubic-bezier(0.16,1,0.3,1) backwards`
                              : undefined,
                          }}
                        />
                      )
                    )}
                  </div>
                  <div className="flex justify-between mt-1.5 px-1">
                    {["W1", "W2", "W3", "W4"].map((w) => (
                      <span key={w} className="text-[8px] font-mono" style={{ color: "#4a4560" }}>
                        {w}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom — split: blockers + activity */}
                <div className="grid grid-cols-5 gap-2.5">
                  <div
                    className="col-span-3 rounded-xl p-3.5"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-[9px] uppercase tracking-[0.15em] font-semibold" style={{ color: "#b4aec8" }}>
                        Top Blockers
                      </p>
                      <span className="text-[8px] font-mono" style={{ color: "#7a7390" }}>
                        3 of 12
                      </span>
                    </div>
                    {[
                      { text: "Hardcoded API key in src/config.ts", type: "critical" },
                      { text: "Missing rate-limit on /api/auth", type: "high" },
                      { text: "Unhandled error in payments/webhook", type: "high" },
                    ].map((task, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 py-1.5"
                        style={{ borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.03)" : "none" }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            background:
                              task.type === "critical" ? "#ef4444" : "#eab308",
                            boxShadow:
                              task.type === "critical"
                                ? "0 0 8px rgba(239,68,68,0.6)"
                                : "0 0 6px rgba(234,179,8,0.4)",
                          }}
                        />
                        <span className="text-[10px] truncate flex-1" style={{ color: "#b4aec8" }}>
                          {task.text}
                        </span>
                        <span
                          className="text-[8px] font-mono px-1 py-0.5 rounded"
                          style={{
                            background:
                              task.type === "critical"
                                ? "rgba(239,68,68,0.12)"
                                : "rgba(234,179,8,0.12)",
                            color: task.type === "critical" ? "#f87171" : "#fbbf24",
                          }}
                        >
                          {task.type}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    className="col-span-2 rounded-xl p-3.5"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <p className="text-[9px] uppercase tracking-[0.15em] font-semibold mb-2.5" style={{ color: "#b4aec8" }}>
                      AI Activity
                    </p>
                    {[
                      { text: "Scan complete — 87/100", time: "now", color: "#22c55e" },
                      { text: "Fix prompt generated", time: "2m", color: "#a855f7" },
                      { text: "Auth flow analyzed", time: "8m", color: "#22d3ee" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 py-1.5"
                        style={{ borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.03)" : "none" }}
                      >
                        <Zap size={9} style={{ color: item.color, marginTop: 2 }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] truncate" style={{ color: "#b4aec8" }}>
                            {item.text}
                          </p>
                          <p className="text-[8px] font-mono" style={{ color: "#4a4560" }}>
                            {item.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Tilt>

        {/* Cursor glare */}
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-50"
          style={{ background: glareGradient() }}
        />
      </motion.div>

      {/* Floating chips around the mockup */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute -left-6 top-1/3 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl animate-float-y"
        style={{
          background: "rgba(168,85,247,0.08)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(168,85,247,0.2)",
          boxShadow: "0 20px 40px -20px rgba(168,85,247,0.4)",
        }}
      >
        <Zap size={12} style={{ color: "#c084fc" }} />
        <span className="text-xs font-semibold" style={{ color: "#e9d5ff" }}>
          +12 pts
        </span>
        <span className="text-[10px]" style={{ color: "#7a7390" }}>
          this scan
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="absolute -right-6 bottom-1/4 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl animate-float-y"
        style={{
          background: "rgba(34,197,94,0.06)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(34,197,94,0.18)",
          boxShadow: "0 20px 40px -20px rgba(34,197,94,0.3)",
          animationDelay: "1s",
        }}
      >
        <Check size={12} style={{ color: "#22c55e" }} />
        <span className="text-xs font-semibold" style={{ color: "#bbf7d0" }}>
          12 fixed
        </span>
        <span className="text-[10px]" style={{ color: "#7a7390" }}>
          today
        </span>
      </motion.div>
    </div>
  );
}
