import { FolderOpen, Loader2, Check, X } from "lucide-react";
import type { Project } from "./types";

interface LinkProjectModalProps {
  projects: Project[];
  currentProjectId: string | null | undefined;
  onLink: (projectId: string | null) => void;
  onClose: () => void;
  linking: boolean;
}

export function LinkProjectModal({
  projects, currentProjectId, onLink, onClose, linking,
}: LinkProjectModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-5 space-y-3"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border-default)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Link to Project</p>
          <button onClick={onClose}>
            <X size={16} style={{ color: "var(--text-tertiary)" }} />
          </button>
        </div>
        {currentProjectId ? (
          <button
            onClick={() => onLink(null)}
            disabled={linking}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs"
            style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-soft)", color: "var(--color-danger)" }}
          >
            <X size={12} /> Unlink from current project
          </button>
        ) : null}
        {projects.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: "var(--text-tertiary)" }}>
            No projects yet — create one first.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => onLink(p.id)}
                disabled={linking || p.id === currentProjectId}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:opacity-80 transition-opacity"
                style={{
                  background: p.id === currentProjectId ? "var(--signal-soft)" : "var(--surface-2)",
                  border: `1px solid ${p.id === currentProjectId ? "var(--accent-cyan-glow)" : "var(--border-default)"}`,
                  opacity: linking ? 0.6 : 1,
                }}
              >
                <FolderOpen size={13} style={{ color: p.id === currentProjectId ? "var(--signal)" : "var(--text-tertiary)", flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                  {p.idea ? <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-tertiary)" }}>{p.idea}</p> : null}
                </div>
                {p.id === currentProjectId ? <Check size={12} style={{ color: "var(--signal)", flexShrink: 0 }} /> : null}
                {linking ? <Loader2 size={11} className="animate-spin shrink-0" style={{ color: "var(--text-tertiary)" }} /> : null}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
