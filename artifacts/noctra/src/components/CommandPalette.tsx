import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
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
  { id: "dashboard", title: "Go to Command Center", description: "Command center — overview of all intelligence", href: "/app", icon: LayoutDashboard, group: "Navigate" },
  { id: "pricing", title: "View Pricing", description: "Check out our pricing plans", href: "/pricing", icon: Rocket, group: "Navigate" },
  { id: "idea", title: "New Idea Check", description: "Idea Checker — validate a startup idea", href: "/app/idea", icon: Lightbulb, group: "Tools" },
  { id: "reality", title: "Run Reality Compiler", description: "Reality Compiler — stress-test assumptions", href: "/app/reality", icon: AlertTriangle, group: "Tools" },
  { id: "proof", title: "Open Proof Engine", description: "Proof Engine — validate with evidence", href: "/app/proof", icon: FlaskConical, group: "Tools" },
  { id: "swarm", title: "Run Market Swarm", description: "Simulate market demand with AI personas", href: "/app/swarm", icon: Users, group: "Tools" },
  { id: "mvp", title: "Plan MVP", description: "MVP Planner — week-by-week build plan", href: "/app/mvp", icon: Map, group: "Tools" },
  { id: "doctor", title: "Upload Project ZIP", description: "Project Doctor — scan code for launch blockers", href: "/app/doctor", icon: Stethoscope, group: "Tools" },
  { id: "launch", title: "Launch Room", description: "Launch Room — go/no-go assessment", href: "/app/launch", icon: Rocket, group: "Tools" },
  { id: "twin", title: "Ask Product Twin", description: "AI chat with full cross-tool memory", href: "/app/twin", icon: Brain, group: "Tools" },
  { id: "tasks", title: "Open Tasks", description: "View and manage your action queue", href: "/app/tasks", icon: CheckSquare, group: "Workspace" },
  { id: "projects", title: "Open Projects", description: "Browse and manage project workspaces", href: "/app/projects", icon: FolderOpen, group: "Workspace" },
  { id: "reports", title: "Open Reports", description: "History of all intelligence analyses", href: "/app/reports", icon: FileText, group: "Workspace" },
  { id: "passport", title: "Passport", description: "Intelligence summary and milestones", href: "/app/passport", icon: BookOpen, group: "Workspace" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setHighlighted(0);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
        style={{ background: "var(--noctra-surface)", border: "1px solid var(--noctra-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--noctra-border)" }}>
          <Search size={15} style={{ color: "var(--noctra-text-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHighlighted(0); }}
            onKeyDown={onKeyDown}
            placeholder="Search tools, pages, actions…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--noctra-text)" }}
          />
          <button onClick={() => setOpen(false)} style={{ color: "var(--noctra-text-muted)" }} className="shrink-0 hover:opacity-80 transition-opacity">
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "var(--noctra-text-muted)" }}>
              No results for "{query}"
            </p>
          ) : (
            <div className="p-2">
              {groups.map((group) => (
                <div key={group}>
                  {!query.trim() && (
                    <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--noctra-text-muted)" }}>
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
                            background: highlighted === idx ? "var(--noctra-surface2)" : "transparent",
                            border: highlighted === idx ? "1px solid var(--noctra-border)" : "1px solid transparent",
                          }}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "rgba(61,216,255,0.08)", border: "1px solid rgba(61,216,255,0.15)" }}
                          >
                            <Icon size={13} style={{ color: "var(--noctra-cyan)" }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>{action.title}</p>
                            <p className="text-xs truncate" style={{ color: "var(--noctra-text-muted)" }}>{action.description}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t flex items-center gap-3" style={{ borderColor: "var(--noctra-border)" }}>
          {[
            ["↑↓", "navigate"],
            ["↵", "open"],
            ["Esc", "close"],
          ].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1 text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}
              >
                {key}
              </kbd>
              {label}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-1 text-[10px] font-mono" style={{ color: "var(--noctra-text-muted)" }}>
            <Command size={10} /> K
          </span>
        </div>
      </div>
    </div>
  );
}
