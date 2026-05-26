import { type ReactNode, type CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── ScoreRing ─────────────────────────────────────────────────────────────

type ScoreRingProps = {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  color?: string;
};

export function ScoreRing({
  value,
  size = 80,
  stroke = 8,
  label,
  color = "var(--noctra-cyan)",
}: ScoreRingProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--noctra-border)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}66)`, transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <div className="-mt-12 flex flex-col items-center" style={{ height: size - 16, justifyContent: "center" }}>
        <span className="text-lg font-bold" style={{ color }}>{pct}</span>
        {label && <span className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>{label}</span>}
      </div>
    </div>
  );
}

// ─── Panel ─────────────────────────────────────────────────────────────────

export function Panel({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${className}`}
      style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)", ...style }}
    >
      {children}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────

type BadgeVariant = "cyan" | "violet" | "emerald" | "amber" | "rose" | "muted" | "gold";

const badgeColors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  cyan:    { bg: "rgba(61,216,255,0.08)",  text: "var(--noctra-cyan)",    border: "rgba(61,216,255,0.2)" },
  violet:  { bg: "rgba(149,117,255,0.08)", text: "var(--noctra-violet)",  border: "rgba(149,117,255,0.2)" },
  emerald: { bg: "rgba(52,211,153,0.08)",  text: "var(--noctra-emerald)", border: "rgba(52,211,153,0.2)" },
  amber:   { bg: "rgba(245,158,11,0.08)",  text: "var(--noctra-amber)",   border: "rgba(245,158,11,0.2)" },
  rose:    { bg: "rgba(244,63,94,0.08)",   text: "var(--noctra-rose)",    border: "rgba(244,63,94,0.2)" },
  gold:    { bg: "rgba(251,191,36,0.08)",  text: "var(--noctra-gold)",    border: "rgba(251,191,36,0.2)" },
  muted:   { bg: "rgba(122,132,153,0.08)", text: "var(--noctra-text-soft)", border: "rgba(122,132,153,0.2)" },
};

export function Badge({
  children,
  variant = "muted",
  style,
  className = "",
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  style?: CSSProperties;
  className?: string;
}) {
  const c = badgeColors[variant];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${className}`}
      style={{ background: c.bg, color: c.text, borderColor: c.border, ...style }}
    >
      {children}
    </span>
  );
}

// ─── StatusDot ────────────────────────────────────────────────────────────

export function StatusDot({ status }: { status: "GREEN" | "YELLOW" | "RED" | string }) {
  const color = status === "GREEN" ? "var(--noctra-emerald)" : status === "YELLOW" ? "var(--noctra-amber)" : "var(--noctra-rose)";
  return <span className="inline-block w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />;
}

// ─── Markdown ─────────────────────────────────────────────────────────────

export function MarkdownView({ content }: { content: string }) {
  return (
    <div className="noctra-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" style={{ color: "var(--noctra-cyan)" }}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
    </svg>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────

export function EmptyState({ icon, title, body, action, children }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      {icon && <div style={{ color: "var(--noctra-text-muted)" }}>{icon}</div>}
      <p className="text-sm font-medium" style={{ color: "var(--noctra-text-soft)" }}>{title}</p>
      {body && <p className="text-xs max-w-xs" style={{ color: "var(--noctra-text-muted)" }}>{body}</p>}
      {action && <div>{action}</div>}
      {children}
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--noctra-text)" }}>{title}</h1>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: "var(--noctra-text-soft)" }}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── NoctraButton ─────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:   "text-black font-semibold",
  secondary: "border font-medium",
  ghost:     "font-medium",
  danger:    "font-medium",
};

export function NoctraButton({
  children, onClick, variant = "secondary", disabled = false, className = "", type = "button", style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  style?: CSSProperties;
}) {
  const baseStyle: Record<string, string> = {
    primary:   "background: var(--noctra-cyan); color: #000;",
    secondary: "background: var(--noctra-surface2); border-color: var(--noctra-border2); color: var(--noctra-text-soft);",
    ghost:     "background: transparent; color: var(--noctra-text-soft);",
    danger:    "background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.3); color: var(--noctra-rose);",
  };
  const resolvedVariant = variant ?? "primary";
  const baseStyleValue = baseStyle[resolvedVariant] ?? baseStyle.primary ?? "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-opacity ${buttonStyles[resolvedVariant]} ${disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-80"} ${className}`}
      style={{ ...Object.fromEntries(baseStyleValue.split(";").filter(Boolean).map((s) => { const [k, ...v] = s.split(":"); return [k?.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()) ?? "", v.join(":").trim()]; })), ...style }}
    >
      {children}
    </button>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  max,
  color = "var(--noctra-cyan)",
  className = "",
}: {
  value: number;
  max?: number;
  color?: string;
  className?: string;
}) {
  const pct = max != null ? Math.max(0, Math.min(100, (value / max) * 100)) : Math.max(0, Math.min(100, value));
  return (
    <div className={`h-1.5 rounded-full overflow-hidden ${className}`} style={{ background: "var(--noctra-border)" }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}44` }}
      />
    </div>
  );
}
