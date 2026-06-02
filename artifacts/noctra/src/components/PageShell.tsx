import { type ReactNode } from "react";
import { ArrowLeft, RefreshCw, Loader2, AlertTriangle, Inbox } from "lucide-react";
import { useLocation } from "wouter";

type PageShellProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  accent?: string;
  children: ReactNode;
  actions?: ReactNode;
  loading?: boolean;
  loadingSkeleton?: ReactNode;
  empty?: boolean;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyBody?: string;
  emptyAction?: ReactNode;
  error?: string | null;
  onRetry?: () => void;
  onBack?: string;
  className?: string;
};

export function PageShell({
  title, subtitle, icon, accent = "var(--signal)", children, actions,
  loading, loadingSkeleton, empty = false, emptyIcon, emptyTitle, emptyBody, emptyAction,
  error, onRetry, onBack, className = "",
}: PageShellProps) {
  const [, navigate] = useLocation();

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-soft)" }}>
            <AlertTriangle size={22} style={{ color: "var(--color-danger)" }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Something went wrong</h2>
            <p className="text-sm mt-1 max-w-md" style={{ color: "var(--text-tertiary)" }}>{error}</p>
          </div>
          {onRetry && (
            <button onClick={onRetry} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
              <RefreshCw size={14} /> Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
        {onBack && (
          <button onClick={() => navigate(onBack)} className="inline-flex items-center gap-1 text-xs hover:opacity-80" style={{ color: "var(--text-tertiary)" }}>
            <ArrowLeft size={11} /> Back
          </button>
        )}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
            <div className="h-3 w-72 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
          </div>
        </div>
        {loadingSkeleton || (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border p-6 animate-pulse" style={{ background: "var(--surface-1)", borderColor: "var(--border-default)" }}>
                <div className="h-4 w-3/4 rounded mb-3" style={{ background: "var(--surface-2)" }} />
                <div className="h-3 w-1/2 rounded mb-2" style={{ background: "var(--surface-2)" }} />
                <div className="h-3 w-2/3 rounded" style={{ background: "var(--surface-2)" }} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 animate-fade-in">
          <div style={{ color: "var(--text-tertiary)", opacity: 0.5 }}>
            {emptyIcon || <Inbox size={40} />}
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{emptyTitle || "Nothing here yet"}</h2>
            {emptyBody && <p className="text-sm mt-1 max-w-md" style={{ color: "var(--text-tertiary)" }}>{emptyBody}</p>}
          </div>
          {emptyAction}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-6 max-w-5xl mx-auto space-y-6 animate-fade-in ${className}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          {onBack && (
            <button onClick={() => navigate(onBack)} className="mt-0.5 shrink-0 p-1 rounded-lg hover:opacity-80 transition-opacity" style={{ color: "var(--text-tertiary)" }}>
              <ArrowLeft size={16} />
            </button>
          )}
          {icon && (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>{title}</h1>
            {subtitle && <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded ${className}`} style={{ background: "var(--surface-2)", ...style }} />;
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border p-4 animate-pulse" style={{ background: "var(--surface-1)", borderColor: "var(--border-default)" }}>
      <div className="h-4 w-1/3 rounded mb-3" style={{ background: "var(--surface-2)" }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 rounded mb-2`} style={{ width: `${60 + Math.random() * 30}%`, background: "var(--surface-2)" }} />
      ))}
    </div>
  );
}
