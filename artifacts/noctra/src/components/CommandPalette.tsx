import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ROUTES } from "@/lib/routes";
import {
  LayoutDashboard, Lightbulb, AlertTriangle, FlaskConical,
  Users, Map, Stethoscope, Rocket, CheckSquare, FolderOpen,
  FileText, Brain, Search, X, Command, BookOpen,
} from "lucide-react";

type PaletteAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  group: string;
};

const ACTIONS: PaletteAction[] = [
  { id: "dashboard", title: "Go to Launch Cockpit", description: "Launch readiness score, blockers, next fix", href: ROUTES.app, icon: LayoutDashboard, group: "Navigate" },
  { id: "pricing", title: "View Pricing", description: "Check out our pricing plans", href: ROUTES.pricing, icon: Rocket, group: "Navigate" },
  { id: "doctor", title: "Run Product Doctor", description: "Scan codebase for launch blockers and fix tasks", href: ROUTES.doctor, icon: Stethoscope, group: "Launch Workflow" },
  { id: "tasks", title: "Open Fix Tasks", description: "View and manage your fix task queue", href: ROUTES.tasks, icon: CheckSquare, group: "Launch Workflow" },
  { id: "launch", title: "Launch Room", description: "Launch Room — go/no-go assessment", href: ROUTES.launch, icon: Rocket, group: "Launch Workflow" },
  { id: "idea", title: "New Idea Check", description: "Idea Checker — validate a startup idea", href: ROUTES.idea, icon: Lightbulb, group: "Supporting Tools" },
  { id: "reality", title: "Run Reality Compiler", description: "Reality Compiler — stress-test assumptions", href: ROUTES.reality, icon: AlertTriangle, group: "Supporting Tools" },
  { id: "proof", title: "Open Proof Engine", description: "Proof Engine — validate with evidence", href: ROUTES.proof, icon: FlaskConical, group: "Supporting Tools" },
  { id: "swarm", title: "Run Market Swarm", description: "Simulate market demand with AI personas", href: ROUTES.swarm, icon: Users, group: "Supporting Tools" },
  { id: "mvp", title: "Plan MVP", description: "MVP Planner — week-by-week build plan", href: ROUTES.mvp, icon: Map, group: "Supporting Tools" },
  { id: "twin", title: "Ask Product Twin", description: "AI chat with full cross-tool memory", href: ROUTES.twin, icon: Brain, group: "Supporting Tools" },
  { id: "projects", title: "Open Projects", description: "Browse and manage project workspaces", href: ROUTES.projects, icon: FolderOpen, group: "Workspace" },
  { id: "reports", title: "Open Reports", description: "History of all analyses and scans", href: ROUTES.reports, icon: FileText, group: "Workspace" },
  { id: "passport", title: "Project Profile", description: "Complete project record and milestones", href: ROUTES.passport, icon: BookOpen, group: "Workspace" },
];

export function CommandPalette({ open: controlledOpen, onClose: controlledOnClose }: { open?: boolean; onClose?: () => void } = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnClose ? (v: boolean) => { if (!v) controlledOnClose(); } : setInternalOpen;
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Use setInternalOpen with callback to avoid stale closure
        setInternalOpen((prev) => !prev);
        setQuery("");
        setHighlighted(0);
      }
      if (e.key === "Escape") {
        if (controlledOnClose) {
          controlledOnClose();
        } else {
          setInternalOpen(false);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [controlledOnClose]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
  }, [open]);

  const filtered = query.trim()
    ? ACTIONS.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.description.toLowerCase().includes(query.toLowerCase()) ||
          a.group.toLowerCase().includes(query.toLowerCase())
      )
    : ACTIONS;

  function handleSelect(action: PaletteAction) {
    navigate(action.href);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (filtered[highlighted]) handleSelect(filtered[highlighted]);
    }
  }

  if (!open) return null;

  const groups = [...new Set(filtered.map((a) => a.group))];

  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center pt-[10vh]"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border-default)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
          <Search size={15} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHighlighted(0); }}
            onKeyDown={onKeyDown}
            placeholder="Search tools, pages, actions…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          <button onClick={() => setOpen(false)} style={{ color: "var(--text-tertiary)" }} className="shrink-0 hover:opacity-80 transition-opacity">
            <X size={14} />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "var(--text-tertiary)" }}>
              No results for "{query}"
            </p>
          ) : (
            <div className="p-2">
              {groups.map((group) => (
                <div key={group}>
                  {!query.trim() && (
                    <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                      {group}
                    </p>
                  )}
                  {filtered
                    .filter((a) => a.group === group)
                    .map((action) => {
                      const idx = filtered.indexOf(action);
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleSelect(action)}
                          onMouseEnter={() => setHighlighted(idx)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                          style={{
                            background: highlighted === idx ? "var(--surface-2)" : "transparent",
                            border: highlighted === idx ? "1px solid var(--border-default)" : "1px solid transparent",
                          }}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "var(--signal-soft)", border: "1px solid var(--border-default)" }}
                          >
                            <Icon size={13} style={{ color: "var(--signal)" }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{action.title}</p>
                            <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>{action.description}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t flex items-center gap-3" style={{ borderColor: "var(--border-default)" }}>
          {[
            ["↑↓", "navigate"],
            ["↵", "open"],
            ["Esc", "close"],
          ].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}
              >
                {key}
              </kbd>
              {label}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-1 text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
            <Command size={10} /> K
          </span>
        </div>
      </div>
    </div>
  );
}
