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
  color = "var(--signal)",
}: ScoreRingProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-default)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}66)`, transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <div className="-mt-12 flex flex-col items-center" style={{ height: size - 16, justifyContent: "center" }}>
        <span className="text-lg font-bold text-mono" style={{ color }}>{pct}</span>
        {label && <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{label}</span>}
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
      style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-sm)", ...style }}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children, color = "var(--text-tertiary)", className = "" }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <p className={`eyebrow ${className}`} style={{ color }}>{children}</p>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────

type BadgeVariant = "cyan" | "violet" | "emerald" | "amber" | "rose" | "muted" | "gold";

const badgeColors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  cyan:    { bg: "var(--signal-soft)",  text: "var(--signal)",    border: "var(--signal-soft)" },
  violet:  { bg: "var(--cosmos-soft)", text: "var(--accent-violet)",  border: "var(--cosmos-soft)" },
  emerald: { bg: "var(--color-success-soft)",  text: "var(--color-success)", border: "var(--color-success-soft)" },
  amber:   { bg: "var(--color-warning-soft)",  text: "var(--color-warning)",   border: "var(--color-warning-soft)" },
  rose:    { bg: "var(--color-danger-soft)",   text: "var(--color-danger)",    border: "var(--color-danger-soft)" },
  gold:    { bg: "var(--color-warning-soft)",  text: "var(--accent-gold)",    border: "var(--color-warning-soft)" },
  muted:   { bg: "var(--surface-3)", text: "var(--text-secondary)", border: "var(--border-default)" },
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
  const color = status === "GREEN" ? "var(--color-success)" : status === "YELLOW" ? "var(--color-warning)" : "var(--color-danger)";
  return <span className="inline-block w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />;
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
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" style={{ color: "var(--signal)" }}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
    </svg>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────

export function EmptyState({ icon, title, body, action, children }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      {icon && <div style={{ color: "var(--text-tertiary)" }}>{icon}</div>}
      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{title}</p>
      {body && <p className="text-xs max-w-xs" style={{ color: "var(--text-tertiary)" }}>{body}</p>}
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
        <h1 className="text-xl font-bold text-display tracking-tight" style={{ color: "var(--text-primary)" }}>{title}</h1>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>}
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
    primary:   "background: var(--signal); color: var(--surface-0);",
    secondary: "background: var(--surface-2); border-color: var(--border-strong); color: var(--text-secondary);",
    ghost:     "background: transparent; color: var(--text-secondary);",
    danger:    "background: var(--color-danger-soft); border: 1px solid var(--color-danger); color: var(--color-danger);",
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
  color = "var(--signal)",
  className = "",
}: {
  value: number;
  max?: number;
  color?: string;
  className?: string;
}) {
  const pct = max != null ? Math.max(0, Math.min(100, (value / max) * 100)) : Math.max(0, Math.min(100, value));
  return (
    <div className={`h-1.5 rounded-full overflow-hidden ${className}`} style={{ background: "var(--border-default)" }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}44` }}
      />
    </div>
  );
}
