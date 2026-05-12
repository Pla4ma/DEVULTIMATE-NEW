import { type ReactNode } from "react";
import { type LucideIcon, Loader2, AlertTriangle } from "lucide-react";

type Phase = "idle" | "running" | "done" | "error";

type Props = {
  icon: LucideIcon;
  label: string;
  accent: string;
  phase: Phase;
  inputPanel: ReactNode;
  outputPanel: ReactNode;
  errorMessage?: string;
};

export function ToolScene({ icon: Icon, label, accent, phase, inputPanel, outputPanel, errorMessage }: Props) {
  return (
    <div className="flex flex-col h-full p-6 gap-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          <Icon size={18} style={{ color: accent }} />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--noctra-text)" }}>{label}</h1>
          {phase === "running" && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Loader2 size={11} className="animate-spin" style={{ color: accent }} />
              <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Processing…</span>
            </div>
          )}
        </div>
      </div>

      {/* Error banner */}
      {phase === "error" && errorMessage && (
        <div className="rounded-xl border px-4 py-3 flex items-start gap-3 shrink-0"
          style={{ background: "rgba(244,63,94,0.05)", borderColor: "rgba(244,63,94,0.2)" }}>
          <AlertTriangle size={15} style={{ color: "var(--noctra-rose)", marginTop: 1 }} />
          <p className="text-sm" style={{ color: "var(--noctra-rose)" }}>{errorMessage}</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <div className="rounded-xl border overflow-hidden flex flex-col"
          style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
          <div className="px-4 py-2.5 border-b shrink-0" style={{ borderColor: "var(--noctra-border)" }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--noctra-text-muted)" }}>Input</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{inputPanel}</div>
        </div>
        <div className="rounded-xl border overflow-hidden flex flex-col"
          style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
          <div className="px-4 py-2.5 border-b shrink-0" style={{ borderColor: "var(--noctra-border)" }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--noctra-text-muted)" }}>Output</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{outputPanel}</div>
        </div>
      </div>
    </div>
  );
}
