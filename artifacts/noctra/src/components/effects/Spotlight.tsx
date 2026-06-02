import { ReactNode, useRef, MouseEvent } from "react";

interface SpotlightProps {
  children: ReactNode;
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Spotlight — wraps children with a mouse-following radial gradient illumination.
 * Subtle, premium glow that follows the cursor.
 */
export function Spotlight({
  children,
  className = "",
  size = 400,
  color = "rgba(168, 85, 247, 0.12)",
}: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(${size}px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${color}, transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
}
