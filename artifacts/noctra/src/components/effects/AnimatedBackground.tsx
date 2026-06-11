import { motion } from "framer-motion";

/* ─── Wave Layers ─────────────────────────────────────────────────────── */

const WAVE_COLORS = {
  violet1: "rgba(139, 92, 246, 0.22)",
  violet2: "rgba(124, 58, 237, 0.18)",
  violet3: "rgba(167, 139, 250, 0.15)",
  orange1: "rgba(249, 115, 22, 0.20)",
  orange2: "rgba(234, 88, 12, 0.16)",
  orange3: "rgba(251, 146, 60, 0.14)",
};

interface WaveLayerProps {
  color: string;
  speed: number;
  yOffset: number;
  amplitude: number;
  phase: number;
  direction?: "left" | "right";
}

function WaveLayer({ color, speed, yOffset, amplitude, phase, direction = "left" }: WaveLayerProps) {
  const translateX = direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"];

  return (
    <div className="absolute inset-x-0 overflow-hidden" style={{ top: `${yOffset}%`, height: `${amplitude * 5}%` }}>
      <motion.div
        className="flex"
        style={{ width: "200%" }}
        animate={{ x: translateX }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <svg
          viewBox="0 0 1440 320"
          className="w-1/2 h-full"
          preserveAspectRatio="none"
          style={{ minWidth: "50%" }}
        >
          <path
            fill={color}
            d={`M0,${160 + phase} C120,${160 + phase - amplitude} 240,${160 + phase + amplitude} 360,${160 + phase} C480,${160 + phase - amplitude} 600,${160 + phase + amplitude} 720,${160 + phase} C840,${160 + phase - amplitude} 960,${160 + phase + amplitude} 1080,${160 + phase} C1200,${160 + phase - amplitude} 1320,${160 + phase + amplitude} 1440,${160 + phase} L1440,320 L0,320 Z`}
          />
        </svg>
        <svg
          viewBox="0 0 1440 320"
          className="w-1/2 h-full"
          preserveAspectRatio="none"
          style={{ minWidth: "50%" }}
        >
          <path
            fill={color}
            d={`M0,${160 + phase} C120,${160 + phase - amplitude} 240,${160 + phase + amplitude} 360,${160 + phase} C480,${160 + phase - amplitude} 600,${160 + phase + amplitude} 720,${160 + phase} C840,${160 + phase - amplitude} 960,${160 + phase + amplitude} 1080,${160 + phase} C1200,${160 + phase - amplitude} 1320,${160 + phase + amplitude} 1440,${160 + phase} L1440,320 L0,320 Z`}
          />
        </svg>
      </motion.div>
    </div>
  );
}

/* ─── Floating Particles ──────────────────────────────────────────────── */

function Particles() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1.5,
    color: i % 3 === 0 ? "rgba(249,115,22,0.5)" : i % 3 === 1 ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.3)",
    duration: Math.random() * 25 + 15,
    delay: Math.random() * 10,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            left: p.x,
            top: p.y,
          }}
          animate={{
            y: [0, -25, 0, 20, 0],
            x: [0, 15, -12, 8, 0],
            opacity: [0.7, 0.3, 0.7, 0.4, 0.7],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Main Background ─────────────────────────────────────────────────── */

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden" style={{ background: "#151030" }}>
      {/* Rich deep violet-navy base — lighter than before */}
      <div className="absolute inset-0" style={{ background: "#151030" }} />

      {/* Top gradient wash — violet */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 60%)",
        }}
      />

      {/* Center-right gradient wash — orange */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 60% 60% at 70% 50%, rgba(249,115,22,0.08) 0%, transparent 50%)",
        }}
      />

      {/* Bottom-left gradient wash — violet */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 50% 50% at 20% 80%, rgba(124,58,237,0.08) 0%, transparent 50%)",
        }}
      />

      {/* Animated Wave Layers */}
      <div className="absolute inset-0">
        {/* Back layer — slow, large violet wave */}
        <WaveLayer
          color={WAVE_COLORS.violet2}
          speed={40}
          yOffset={15}
          amplitude={50}
          phase={30}
          direction="left"
        />
        {/* Back layer — slow, large orange wave */}
        <WaveLayer
          color={WAVE_COLORS.orange2}
          speed={45}
          yOffset={25}
          amplitude={45}
          phase={-15}
          direction="right"
        />
        {/* Mid layer — medium violet wave */}
        <WaveLayer
          color={WAVE_COLORS.violet1}
          speed={30}
          yOffset={40}
          amplitude={40}
          phase={20}
          direction="left"
        />
        {/* Mid layer — medium orange wave */}
        <WaveLayer
          color={WAVE_COLORS.orange1}
          speed={35}
          yOffset={50}
          amplitude={35}
          phase={-10}
          direction="right"
        />
        {/* Front layer — faster light violet wave */}
        <WaveLayer
          color={WAVE_COLORS.violet3}
          speed={22}
          yOffset={60}
          amplitude={30}
          phase={15}
          direction="left"
        />
        {/* Front layer — faster light orange wave */}
        <WaveLayer
          color={WAVE_COLORS.orange3}
          speed={28}
          yOffset={70}
          amplitude={25}
          phase={-20}
          direction="right"
        />
        {/* Extra front layer — bright orange */}
        <WaveLayer
          color={WAVE_COLORS.orange1}
          speed={25}
          yOffset={80}
          amplitude={35}
          phase={10}
          direction="left"
        />
        {/* Extra front layer — bright violet */}
        <WaveLayer
          color={WAVE_COLORS.violet1}
          speed={32}
          yOffset={90}
          amplitude={30}
          phase={-5}
          direction="right"
        />
      </div>

      {/* Floating particles */}
      <Particles />

      {/* Vignette — lighter than before */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 50%, rgba(21,16,48,0.3) 100%)",
        }}
      />
    </div>
  );
}
