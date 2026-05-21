import { type ReactNode } from "react";
import { type LucideIcon, Loader2, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export type ScenePhase = "idle" | "running" | "done" | "error";

type Props = {
  icon: LucideIcon;
  label: string;
  accent: string;
  phase: ScenePhase;
  inputPanel: ReactNode;
  outputPanel: ReactNode;
  errorMessage?: string;
  description?: string;
  stage?: string;
};

export function ToolScene({ icon: Icon, label, accent, phase, inputPanel, outputPanel, errorMessage, description, stage }: Props) {
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 gap-5 max-w-6xl mx-auto w-full animate-fade-in">
      <button onClick={() => navigate("/app")} className="inline-flex items-center gap-1 text-xs hover:opacity-80 transition-opacity w-fit" style={{ color: "var(--noctra-text-muted)" }}>
        <ArrowLeft size={11} /> Back to Launch Cockpit
      </button>

      <div className="flex items-start gap-3 shrink-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
          style={{
            background: phase === "done" ? "rgba(52,211,153,0.12)" : `${accent}18`,
            border: `1px solid ${phase === "done" ? "rgba(52,211,153,0.25)" : `${accent}30`}`,
            boxShadow: phase === "running" ? `0 0 20px ${accent}22` : "none",
          }}
        >
          {phase === "done" ? (
            <CheckCircle size={18} style={{ color: "var(--noctra-emerald)" }} />
          ) : (
            <Icon size={18} style={{ color: phase === "running" ? accent : "var(--noctra-text-soft)" }} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold truncate" style={{ color: "var(--noctra-text)" }}>{label}</h1>
          {phase === "idle" && description && (
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{description}</p>
          )}
          {phase === "running" && (
            <div className="flex items-center gap-2 mt-0.5">
              <Loader2 size={12} className="animate-spin" style={{ color: accent }} />
              <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{stage || "Processing..."}</span>
            </div>
          )}
          {phase === "done" && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-medium" style={{ color: "var(--noctra-emerald)" }}>Analysis complete</span>
            </div>
          )}
        </div>
      </div>

      {phase === "error" && errorMessage && (
        <div className="rounded-xl border px-4 py-3 flex items-start gap-3 shrink-0 animate-fade-in"
          style={{ background: "rgba(244,63,94,0.05)", borderColor: "rgba(244,63,94,0.2)" }}>
          <AlertTriangle size={15} style={{ color: "var(--noctra-rose)", marginTop: 1, flexShrink: 0 }} />
          <p className="text-sm" style={{ color: "var(--noctra-rose)" }}>{errorMessage}</p>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <div className="rounded-xl border overflow-hidden flex flex-col"
          style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
          <div className="px-4 py-2.5 border-b shrink-0 flex items-center justify-between" style={{ borderColor: "var(--noctra-border)" }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--noctra-text-muted)" }}>Input</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{inputPanel}</div>
        </div>
        <div className="rounded-xl border overflow-hidden flex flex-col"
          style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
          <div className="px-4 py-2.5 border-b shrink-0 flex items-center justify-between" style={{ borderColor: "var(--noctra-border)" }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--noctra-text-muted)" }}>Output</span>
            {phase === "running" && <Loader2 size={12} className="animate-spin" style={{ color: accent }} />}
          </div>
          <div className="flex-1 overflow-y-auto p-4">{outputPanel}</div>
        </div>
      </div>
    </div>
  );
}
