import { useEffect, useRef, ReactNode, MouseEvent } from "react";

interface BeamButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  beamColor?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
  pulse?: boolean;
  disabled?: boolean;
}

const sizeMap = {
  sm: "px-4 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-sm",
};

/**
 * BeamButton — premium CTA with light beam that travels across on hover.
 * Cursor-tracked beam position. Multiple beam layers for depth.
 */
export function BeamButton({
  children,
  variant = "primary",
  size = "md",
  onClick,
  className = "",
  type = "button",
  beamColor = "rgba(255, 255, 255, 0.6)",
  icon,
  iconRight,
  pulse = false,
  disabled = false,
}: BeamButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!ref.current || !beamRef.current || disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    beamRef.current.style.setProperty("--beam-x", `${x}px`);
    beamRef.current.style.setProperty("--beam-y", `${y}px`);
  };

  const base =
    "group relative inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-500/40 active:scale-[0.97] overflow-hidden whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClass =
    variant === "primary"
      ? "text-white"
      : variant === "secondary"
      ? "text-text-primary glass-strong hover:border-aurora-500/30"
      : "text-text-secondary hover:text-text-primary";

  return (
    <button
      ref={ref}
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      className={`${base} ${sizeMap[size]} ${variantClass} ${className}`}
      style={
        variant === "primary"
          ? {
              background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 50%, #f97316 100%)",
              boxShadow: "0 8px 32px -8px rgba(139, 92, 246, 0.5), 0 0 20px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
            }
          : undefined
      }
    >
      {variant === "primary" && pulse && (
        <span
          className="absolute inset-0 -z-10 rounded-xl blur-xl opacity-60"
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #f97316 100%)",
            animation: "breathe 3s ease-in-out infinite",
          }}
        />
      )}
      {icon}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {iconRight}
      <div
        ref={beamRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        <span
          className="absolute pointer-events-none"
          style={{
            top: "var(--beam-y, 50%)",
            left: "var(--beam-x, 50%)",
            width: 220,
            height: 220,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${beamColor} 0%, transparent 60%)`,
            filter: "blur(20px)",
          }}
        />
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-[220%] transition-transform duration-1000 ease-out"
        style={{
          background:
            "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)",
          mixBlendMode: "overlay",
        }}
      />
    </button>
  );
}
