import { ReactNode } from "react";
import { Tilt } from "./Tilt";
import { Spotlight } from "./Spotlight";

interface BentoTileProps {
  children: ReactNode;
  className?: string;
  tiltIntensity?: number;
  accent?: "violet" | "fuchsia" | "cyan" | "pink";
}

const accentMap = {
  violet: { border: "rgba(168,85,247,0.18)", glow: "rgba(168,85,247,0.25)" },
  fuchsia: { border: "rgba(232,121,249,0.18)", glow: "rgba(232,121,249,0.25)" },
  cyan: { border: "rgba(34,211,238,0.18)", glow: "rgba(34,211,238,0.22)" },
  pink: { border: "rgba(244,114,182,0.18)", glow: "rgba(244,114,182,0.25)" },
};

/**
 * BentoTile — bento grid primitive combining Tilt + Spotlight + glass card.
 * Use as the basic building block for bento feature grids.
 */
export function BentoTile({
  children,
  className = "",
  tiltIntensity = 8,
  accent = "violet",
}: BentoTileProps) {
  const c = accentMap[accent];
  return (
    <Spotlight
      className="group relative rounded-2xl overflow-hidden transition-all duration-500"
      color={c.glow}
      size={500}
    >
      <Tilt intensity={tiltIntensity} className="h-full">
        <div
          className={`relative h-full overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-500 group-hover:border-opacity-100 ${className}`}
          style={{
            background:
              "linear-gradient(180deg, rgba(26,15,46,0.5) 0%, rgba(10,6,18,0.5) 100%)",
            borderColor: c.border,
          }}
        >
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
            }}
          />
          <div className="relative h-full">{children}</div>
        </div>
      </Tilt>
    </Spotlight>
  );
}
