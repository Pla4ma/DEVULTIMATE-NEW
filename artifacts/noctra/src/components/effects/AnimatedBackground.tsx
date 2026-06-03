import { motion } from "framer-motion";

const VIOLET_SOLID = "rgba(139, 92, 246, 0.35)";
const VIOLET_DEEP = "rgba(124, 58, 237, 0.4)";
const ORANGE_SOLID = "rgba(249, 115, 22, 0.3)";
const ORANGE_DEEP = "rgba(234, 88, 12, 0.35)";
const VIOLET_BRIGHT = "rgba(167, 139, 250, 0.15)";
const ORANGE_BRIGHT = "rgba(251, 146, 60, 0.15)";

const SHAPES = [
  // Large violet circle top-left
  {
    w: "55vw", h: "55vw",
    bg: VIOLET_DEEP,
    borderRadius: "50%",
    initial: { x: "-15%", y: "-10%", rotate: 0 },
    animate: { x: ["-15%", "-5%", "-15%"], y: ["-10%", "5%", "-10%"], rotate: [0, 5, 0] },
    duration: 25,
    blur: 0,
  },
  // Large orange circle right side
  {
    w: "50vw", h: "50vw",
    bg: ORANGE_DEEP,
    borderRadius: "50%",
    initial: { x: "60%", y: "10%", rotate: 0 },
    animate: { x: ["60%", "55%", "60%"], y: ["10%", "20%", "10%"], rotate: [0, -5, 0] },
    duration: 30,
    blur: 0,
  },
  // Violet rectangle bottom-left
  {
    w: "40vw", h: "30vw",
    bg: VIOLET_SOLID,
    borderRadius: "24px",
    initial: { x: "-5%", y: "70%", rotate: -12 },
    animate: { x: ["-5%", "5%", "-5%"], y: ["70%", "65%", "70%"], rotate: [-12, -8, -12] },
    duration: 35,
    blur: 0,
  },
  // Orange rectangle top-right
  {
    w: "35vw", h: "25vw",
    bg: ORANGE_SOLID,
    borderRadius: "24px",
    initial: { x: "75%", y: "-5%", rotate: 8 },
    animate: { x: ["75%", "70%", "75%"], y: ["-5%", "0%", "-5%"], rotate: [8, 12, 8] },
    duration: 28,
    blur: 0,
  },
  // Medium violet circle center-left
  {
    w: "30vw", h: "30vw",
    bg: VIOLET_BRIGHT,
    borderRadius: "50%",
    initial: { x: "20%", y: "40%", rotate: 0 },
    animate: { x: ["20%", "25%", "20%"], y: ["40%", "35%", "40%"], rotate: [0, 10, 0] },
    duration: 32,
    blur: 0,
  },
  // Medium orange circle center-right
  {
    w: "28vw", h: "28vw",
    bg: ORANGE_BRIGHT,
    borderRadius: "50%",
    initial: { x: "55%", y: "50%", rotate: 0 },
    animate: { x: ["55%", "60%", "55%"], y: ["50%", "55%", "50%"], rotate: [0, -8, 0] },
    duration: 26,
    blur: 0,
  },
  // Small violet square bottom-right
  {
    w: "20vw", h: "20vw",
    bg: VIOLET_SOLID,
    borderRadius: "16px",
    initial: { x: "80%", y: "75%", rotate: 15 },
    animate: { x: ["80%", "75%", "80%"], y: ["75%", "70%", "75%"], rotate: [15, 20, 15] },
    duration: 22,
    blur: 0,
  },
  // Small orange square middle-left
  {
    w: "18vw", h: "18vw",
    bg: ORANGE_SOLID,
    borderRadius: "16px",
    initial: { x: "5%", y: "35%", rotate: -8 },
    animate: { x: ["5%", "10%", "5%"], y: ["35%", "30%", "35%"], rotate: [-8, -5, -8] },
    duration: 24,
    blur: 0,
  },
];

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden" style={{ background: "#000000" }}>
      {/* Solid black base */}
      <div className="absolute inset-0" style={{ background: "#000000" }} />

      {/* Grid pattern overlay for tech feel */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Solid colored shapes */}
      {SHAPES.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: shape.w,
            height: shape.h,
            background: shape.bg,
            borderRadius: shape.borderRadius,
            filter: shape.blur > 0 ? `blur(${shape.blur}px)` : undefined,
          }}
          initial={shape.initial}
          animate={shape.animate}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Thin line accents */}
      <div className="absolute top-[20%] left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)" }} />
      <div className="absolute top-[60%] left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.15), transparent)" }} />
      <div className="absolute top-[85%] left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.1), transparent)" }} />

      {/* Dark overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      {/* Bottom fade for footer */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[30vh]"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </div>
  );
}
