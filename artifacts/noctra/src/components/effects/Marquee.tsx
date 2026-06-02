import { ReactNode } from "react";

interface MarqueeProps {
  children: ReactNode;
  speed?: "slow" | "normal" | "fast";
  direction?: "left" | "right";
  className?: string;
  pauseOnHover?: boolean;
}

/**
 * Marquee — infinite horizontal scroll for logos, testimonials, etc.
 * Gradient fade on edges.
 */
export function Marquee({
  children,
  speed = "normal",
  direction = "left",
  className = "",
  pauseOnHover = true,
}: MarqueeProps) {
  const speedClass =
    speed === "fast" ? "animate-marquee-fast" : "animate-marquee";
  const directionClass = direction === "right" ? "animate-marquee-reverse" : "";
  const hoverClass = pauseOnHover ? "hover:[animation-play-state:paused]" : "";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Edge fade masks */}
      <div
        className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, var(--color-void-0) 0%, transparent 100%)",
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(270deg, var(--color-void-0) 0%, transparent 100%)",
        }}
      />
      <div className={`flex w-max ${speedClass} ${directionClass} ${hoverClass}`}>
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
