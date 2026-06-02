import { Target, Brain, Code2, Rocket, CheckCircle, Zap } from "lucide-react";

export function AnimatedWorkflow() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--signal)] via-[var(--accent-violet)] to-[var(--signal)] opacity-20 blur-3xl rounded-full" />
      <div className="relative bg-[var(--surface-1)] border border-[var(--border-default)] rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-[var(--color-danger)]" />
          <div className="w-3 h-3 rounded-full bg-[var(--color-warning)]" />
          <div className="w-3 h-3 rounded-full bg-[var(--color-success)]" />
          <span className="ml-2 text-xs text-[var(--text-tertiary)]">Noctra Analysis Engine</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-default)] animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-[var(--signal-soft)] flex items-center justify-center">
              <Target size={14} style={{ color: "var(--signal)" }} />
            </div>
            <div className="flex-1">
              <div className="h-2 w-24 rounded bg-[var(--signal)] opacity-40 mb-1" />
              <div className="h-2 w-32 rounded bg-[var(--text-tertiary)] opacity-20" />
            </div>
            <div className="w-16 h-6 rounded bg-[var(--color-success)] opacity-60" />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-default)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-danger-soft)] flex items-center justify-center">
              <Brain size={14} style={{ color: "var(--color-danger)" }} />
            </div>
            <div className="flex-1">
              <div className="h-2 w-28 rounded bg-[var(--color-danger)] opacity-40 mb-1" />
              <div className="h-2 w-20 rounded bg-[var(--text-tertiary)] opacity-20" />
            </div>
            <div className="w-16 h-6 rounded bg-[var(--color-warning)] opacity-60" />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-default)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--cosmos-soft)] flex items-center justify-center">
              <Code2 size={14} style={{ color: "var(--accent-violet)" }} />
            </div>
            <div className="flex-1">
              <div className="h-2 w-32 rounded bg-[var(--accent-violet)] opacity-40 mb-1" />
              <div className="h-2 w-24 rounded bg-[var(--text-tertiary)] opacity-20" />
            </div>
            <div className="w-16 h-6 rounded bg-[var(--signal)] opacity-60" />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--signal)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--signal-soft)] flex items-center justify-center">
              <Rocket size={14} style={{ color: "var(--signal)" }} />
            </div>
            <div className="flex-1">
              <div className="h-2 w-20 rounded bg-[var(--signal)] mb-1" />
              <div className="h-2 w-28 rounded bg-[var(--text-tertiary)] opacity-20" />
            </div>
            <div className="w-6 h-6 rounded-full bg-[var(--signal)] flex items-center justify-center">
              <CheckCircle size={12} className="text-black" />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--border-default)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={12} style={{ color: "var(--signal)" }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Analysis complete</span>
          </div>
          <span className="text-xs font-mono" style={{ color: "var(--color-success)" }}>12s</span>
        </div>
      </div>
    </div>
  );
}
