import { Target, Brain, Code2, Rocket, CheckCircle, Zap } from "lucide-react";

export function AnimatedWorkflow() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--noctra-cyan)] via-[var(--noctra-violet)] to-[var(--noctra-cyan)] opacity-20 blur-3xl rounded-full" />
      <div className="relative bg-[var(--noctra-surface)] border border-[var(--noctra-border)] rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-[var(--noctra-rose)]" />
          <div className="w-3 h-3 rounded-full bg-[var(--noctra-amber)]" />
          <div className="w-3 h-3 rounded-full bg-[var(--noctra-emerald)]" />
          <span className="ml-2 text-xs text-[var(--noctra-text-muted)]">Noctra Analysis Engine</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--noctra-surface2)] border border-[var(--noctra-border)] animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-[rgba(61,216,255,0.15)] flex items-center justify-center">
              <Target size={14} style={{ color: "var(--noctra-cyan)" }} />
            </div>
            <div className="flex-1">
              <div className="h-2 w-24 rounded bg-[var(--noctra-cyan)] opacity-40 mb-1" />
              <div className="h-2 w-32 rounded bg-[var(--noctra-text-muted)] opacity-20" />
            </div>
            <div className="w-16 h-6 rounded bg-[var(--noctra-emerald)] opacity-60" />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--noctra-surface2)] border border-[var(--noctra-border)]">
            <div className="w-8 h-8 rounded-lg bg-[rgba(244,63,94,0.15)] flex items-center justify-center">
              <Brain size={14} style={{ color: "var(--noctra-rose)" }} />
            </div>
            <div className="flex-1">
              <div className="h-2 w-28 rounded bg-[var(--noctra-rose)] opacity-40 mb-1" />
              <div className="h-2 w-20 rounded bg-[var(--noctra-text-muted)] opacity-20" />
            </div>
            <div className="w-16 h-6 rounded bg-[var(--noctra-amber)] opacity-60" />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--noctra-surface2)] border border-[var(--noctra-border)]">
            <div className="w-8 h-8 rounded-lg bg-[rgba(149,117,255,0.15)] flex items-center justify-center">
              <Code2 size={14} style={{ color: "var(--noctra-violet)" }} />
            </div>
            <div className="flex-1">
              <div className="h-2 w-32 rounded bg-[var(--noctra-violet)] opacity-40 mb-1" />
              <div className="h-2 w-24 rounded bg-[var(--noctra-text-muted)] opacity-20" />
            </div>
            <div className="w-16 h-6 rounded bg-[var(--noctra-cyan)] opacity-60" />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--noctra-surface2)] border border-[var(--noctra-cyan)]">
            <div className="w-8 h-8 rounded-lg bg-[rgba(61,216,255,0.2)] flex items-center justify-center">
              <Rocket size={14} style={{ color: "var(--noctra-cyan)" }} />
            </div>
            <div className="flex-1">
              <div className="h-2 w-20 rounded bg-[var(--noctra-cyan)] mb-1" />
              <div className="h-2 w-28 rounded bg-[var(--noctra-text-muted)] opacity-20" />
            </div>
            <div className="w-6 h-6 rounded-full bg-[var(--noctra-cyan)] flex items-center justify-center">
              <CheckCircle size={12} className="text-black" />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--noctra-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={12} style={{ color: "var(--noctra-cyan)" }} />
            <span className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>Analysis complete</span>
          </div>
          <span className="text-xs font-mono" style={{ color: "var(--noctra-emerald)" }}>12s</span>
        </div>
      </div>
    </div>
  );
}
