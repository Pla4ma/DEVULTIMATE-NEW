import { ReactNode } from "react";

interface MeteorShowerProps {
  count?: number;
  className?: string;
  color?: string;
}

/**
 * MeteorShower — falling light streaks used in dark hero sections.
 * Pure CSS — minimal GPU cost.
 */
export function MeteorShower({
  count = 12,
  className = "",
  color = "rgba(192, 132, 252, 0.6)",
}: MeteorShowerProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const top = Math.random() * 60;
        const delay = Math.random() * 6;
        const dur = 3 + Math.random() * 4;
        const len = 80 + Math.random() * 120;
        return (
          <span
            key={i}
            className="absolute"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: 1,
              height: len,
              background: `linear-gradient(180deg, transparent, ${color})`,
              filter: "blur(0.4px)",
              transform: "rotate(215deg)",
              animation: `meteor-fall ${dur}s linear ${delay}s infinite`,
              opacity: 0,
            }}
          />
        );
      })}
    </div>
  );
}
