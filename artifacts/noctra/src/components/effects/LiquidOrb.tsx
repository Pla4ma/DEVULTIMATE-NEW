interface LiquidOrbProps {
  size?: number;
  color?: string;
  className?: string;
  delay?: number;
  blur?: number;
}

/**
 * LiquidOrb — animated morphing blob with conic-gradient interior.
 * Used as ambient backdrop for hero/section focal points.
 */
export function LiquidOrb({
  size = 320,
  color = "rgba(168, 85, 247, 0.45)",
  className = "",
  delay = 0,
  blur = 60,
}: LiquidOrbProps) {
  return (
    <div
      aria-hidden
      className={`absolute pointer-events-none animate-blob-morph ${className}`}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(from 0deg, ${color}, rgba(232,121,249,0.25), rgba(34,211,238,0.18), ${color})`,
        filter: `blur(${blur}px)`,
        animationDelay: `${delay}s`,
        opacity: 0.55,
      }}
    />
  );
}
