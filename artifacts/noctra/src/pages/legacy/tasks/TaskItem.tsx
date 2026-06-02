import { useState } from "react";
import { useLocation } from "wouter";
import {
  CheckCircle, Circle, Loader2, ChevronDown, Trash2,
} from "lucide-react";
import { Panel, Badge } from "@/components/Primitives";
import { normalizeStatus, PRIORITY_COLOR, STATUS_COLOR } from "./tasks-types";
import type { Task } from "./tasks-types";

interface TaskItemProps {
  task: Task;
  togglingId: string | null;
  deletingId: string | null;
  selectedIds: Set<string>;
  projectMap: Record<string, string>;
  onToggleStatus: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleSelect: (id: string) => void;
}

export function TaskItem({
  task, togglingId, deletingId, selectedIds, projectMap,
  onToggleStatus, onDelete, onToggleSelect,
}: TaskItemProps) {
  const [, navigate] = useLocation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const isExpanded = expandedId === task.id;

  return (
    <Panel key={task.id} style={{ padding: "0" }}>
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() => onToggleStatus(task)}
            disabled={togglingId === task.id}
            className="mt-0.5 shrink-0 transition-opacity hover:opacity-70"
          >
            {togglingId === task.id ? (
              <Loader2 size={16} className="animate-spin" style={{ color: STATUS_COLOR[task.status] }} />
            ) : task.status === "completed" ? (
              <CheckCircle size={16} style={{ color: "var(--color-success)" }} />
            ) : task.status === "in-progress" ? (
              <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: "var(--signal)", background: "var(--signal-soft)" }} />
            ) : (
              <Circle size={16} style={{ color: "var(--border-default)" }} />
            )}
          </button>

          <input
            type="checkbox"
            checked={selectedIds.has(task.id)}
            onChange={() => onToggleSelect(task.id)}
            className="mt-1 shrink-0 accent-cyan-400"
          />

          <div className="flex-1 min-w-0">
            <button onClick={() => setExpandedId(isExpanded ? null : task.id)} className="w-full text-left">
              <p className="text-sm" style={{ color: task.status === "completed" ? "var(--text-tertiary)" : "var(--text-primary)", textDecoration: task.status === "completed" ? "line-through" : "none" }}>
                {task.title}
              </p>
            </button>
            {isExpanded && (task.detail || task.acceptance_criteria) && (
              <div className="mt-2 space-y-2">
                {task.detail && (
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>{task.detail}</p>
                )}
                {task.acceptance_criteria && task.acceptance_criteria.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--signal)" }}>Acceptance Criteria</p>
                    <ul className="space-y-1">
                      {task.acceptance_criteria.map((c, i) => (
                        <li key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: "var(--text-tertiary)" }}>
                          <CheckCircle size={10} className="mt-0.5 shrink-0" style={{ color: "var(--color-success)" }} />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {isExpanded && (task.source_report_id || task.project_id) && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {task.source_report_id && (
                  <button
                    onClick={() => navigate(`/app/reports/${task.source_report_id}`)}
                    className="text-[11px] px-2 py-1 rounded-full"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--signal)" }}
                  >
                    View source report
                  </button>
                )}
                {task.project_id && (
                  <button
                    onClick={() => navigate(`/app/projects/${task.project_id}`)}
                    className="text-[11px] px-2 py-1 rounded-full"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-tertiary)" }}
                  >
                    {projectMap[task.project_id] ? `Project: ${projectMap[task.project_id]}` : "View project"}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {task.priority && (
              <div className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLOR[task.priority] ?? "var(--text-tertiary)" }} title={task.priority} />
            )}
            {task.category && (
              <Badge style={{ fontSize: "10px", opacity: 0.7 }}>{task.category}</Badge>
            )}
            {confirmDeleteId === task.id ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { onDelete(task.id); setConfirmDeleteId(null); }}
                  disabled={deletingId === task.id}
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: "var(--surface-2)", color: "var(--text-tertiary)" }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteId(task.id)}
                className="p-1 rounded opacity-30 hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} style={{ color: "var(--color-danger)" }} />
              </button>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
