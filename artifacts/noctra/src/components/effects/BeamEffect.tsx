interface BeamEffectProps {
  className?: string;
  count?: number;
  color?: string;
  duration?: number;
  delay?: number;
  blur?: number;
  vertical?: boolean;
}

/**
 * BeamEffect — animated light beams sweeping across an element.
 * CSS-only, performant. Used in CTAs and section transitions.
 */
export function BeamEffect({
  className = "",
  count = 3,
  color = "rgba(192, 132, 252, 0.5)",
  duration = 4,
  delay = 0,
  blur = 30,
  vertical = false,
}: BeamEffectProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            top: 0,
            left: 0,
            width: vertical ? "100%" : "60%",
            height: vertical ? "60%" : "100%",
            background: vertical
              ? `linear-gradient(180deg, transparent, ${color}, transparent)`
              : `linear-gradient(90deg, transparent, ${color}, transparent)`,
            filter: `blur(${blur}px)`,
            transform: vertical
              ? "translateY(-100%) skewX(-20deg)"
              : "translateX(-100%) skewX(-20deg)",
            animation: `${vertical ? "beam-v" : "beam-h"} ${duration}s ease-in-out ${delay + i * (duration / count)}s infinite`,
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  );
}
