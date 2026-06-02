import { ReactNode, useRef, MouseEvent } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  spotlight?: boolean;
  spotlightColor?: string;
  borderBeam?: boolean;
  onClick?: () => void;
}

/**
 * GlowCard — premium glass card with optional cursor-tracking spotlight
 * and animated gradient border beam.
 */
export function GlowCard({
  children,
  className = "",
  innerClassName = "",
  spotlight = true,
  spotlightColor = "rgba(168, 85, 247, 0.12)",
  borderBeam = false,
  onClick,
}: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden rounded-2xl glass-strong transition-all duration-500 hover:border-aurora-500/25 ${className}`}
      style={{
        background:
          "linear-gradient(180deg, rgba(26,15,46,0.55) 0%, rgba(10,6,18,0.55) 100%)",
      }}
    >
      {borderBeam && (
        <div
          aria-hidden
          className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              "conic-gradient(from var(--angle,0deg), transparent 0deg, rgba(168,85,247,0.4) 60deg, transparent 120deg, rgba(232,121,249,0.3) 200deg, transparent 280deg, rgba(168,85,247,0.4) 360deg)",
            animation: "spin-slow 4s linear infinite",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: 1,
          }}
        />
      )}
      {spotlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(400px circle at var(--mx,50%) var(--my,50%), ${spotlightColor}, transparent 50%)`,
          }}
        />
      )}
      <div className={`relative z-10 ${innerClassName}`}>{children}</div>
    </div>
  );
}
