import { motion } from "framer-motion";

interface LogoMarkProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function LogoMark({ size = 32, className = "", animated = false }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="noctra-ring" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--signal-deep)" />
          <stop offset="0.55" stopColor="var(--signal)" />
          <stop offset="1" stopColor="var(--accent-gold)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="17" stroke="url(#noctra-ring)" strokeWidth="1.5" opacity="0.85" />
      <circle cx="20" cy="20" r="11.5" stroke="var(--border-strong)" strokeWidth="1" opacity="0.6" />
      <path d="M14 26V14L26 26V14" stroke="url(#noctra-ring)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="2.4" fill="var(--signal)" />
      {animated ? (
        <motion.circle
          cx="20" cy="3" r="1.4" fill="var(--accent-gold)"
          style={{ transformOrigin: "20px 20px" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      ) : (
        <circle cx="20" cy="3" r="1.4" fill="var(--accent-gold)" />
      )}
    </svg>
  );
}

interface LogoProps {
  size?: number;
  wordmark?: boolean;
  className?: string;
  animated?: boolean;
}

export function Logo({ size = 32, wordmark = true, className = "", animated = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} animated={animated} />
      {wordmark && (
        <span
          className="text-display font-bold"
          style={{ fontSize: size * 0.56, letterSpacing: "0.14em", color: "var(--text-primary)" }}
        >
          NOCTRA
        </span>
      )}
    </span>
  );
}
