import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { TOOLS, TOOL_GROUPS, GROUP_DESCRIPTION, type Tool } from "@/lib/noctra-tools";
import { useProgression } from "@/lib/progression-context";
import { isDemoMode } from "@/lib/demo-mode";
import {
  LogOut, Menu, X, ChevronLeft, Zap, Shield, Command, Check, LayoutDashboard,
  Lightbulb, AlertTriangle, FlaskConical, Users, Map, Stethoscope, Rocket, Brain,
  FileText, CheckSquare, FolderOpen, BookOpen, Circle,
} from "lucide-react";

const TOOL_ICONS: Record<string, typeof Zap> = {
  dashboard: LayoutDashboard, idea: Lightbulb, reality: AlertTriangle, proof: FlaskConical,
  swarm: Users, mvp: Map, doctor: Stethoscope, launch: Rocket, twin: Brain,
};

function NavItem({ tool, collapsed, onClick }: { tool: Tool; collapsed: boolean; onClick?: () => void }) {
  const [location] = useLocation();
  const { usedTools } = useProgression();
  const active = location === tool.route || (tool.route !== "/app" && location.startsWith(tool.route));
  const Icon = TOOL_ICONS[tool.key] || tool.icon;
  const hasBeenUsed = usedTools.has(tool.key);

  return (
    <Link href={tool.route} onClick={onClick}>
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer group relative ${
          active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
        }`}
        style={{
          borderLeft: active ? `2px solid ${tool.accent}` : "2px solid transparent",
          boxShadow: active ? `inset 0 1px 0 ${tool.accent}10` : "none",
        }}
        title={collapsed ? tool.label : undefined}
      >
        <Icon className="shrink-0" size={16} style={{ color: active ? tool.accent : "var(--noctra-text-muted)" }} />
        {!collapsed && (
          <span
            className={`text-sm font-medium truncate flex-1 transition-colors ${
              active ? "" : "group-hover:text-[var(--noctra-text)]"
            }`}
            style={{ color: active ? tool.accent : "var(--noctra-text-soft)" }}
          >
            {tool.label}
          </span>
        )}
        {!collapsed && hasBeenUsed && (
          <Check size={10} style={{ color: "var(--noctra-emerald)" }} />
        )}
      </div>
    </Link>
  );
}

function SidebarContent({ collapsed, onNav }: { collapsed: boolean; onNav?: () => void }) {
  const { signOut, user } = useAuth();
  const { capabilityStatus, coverageScore } = useProgression();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-4 h-14 border-b shrink-0" style={{ borderColor: "var(--noctra-border)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--noctra-cyan)", boxShadow: "0 0 12px var(--noctra-cyan-glow)" }}>
          <Zap size={14} className="text-black" />
        </div>
        {!collapsed && <span className="font-bold text-sm tracking-wide" style={{ color: "var(--noctra-text)" }}>DEVULTIMATE</span>}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {TOOL_GROUPS.map((group) => {
          const groupTools = TOOLS.filter((t) => t.group === group).sort((a, b) => a.order - b.order);
          if (groupTools.length === 0) return null;
          return (
            <div key={group}>
              {!collapsed && (
                <div className="px-3 pt-4 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--noctra-text-muted)" }}>{group}</span>
                  <p className="text-[9px] mt-0.5" style={{ color: "var(--noctra-text-muted)", opacity: 0.5 }}>{GROUP_DESCRIPTION[group]}</p>
                </div>
              )}
              {groupTools.map((t) => <NavItem key={t.key} tool={t} collapsed={collapsed} onClick={onNav} />)}
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-3 py-3 border-t space-y-3" style={{ borderColor: "var(--noctra-border)" }}>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Workspace Coverage</span>
              <span className="text-[10px] font-mono" style={{ color: coverageScore >= 70 ? "var(--noctra-emerald)" : coverageScore >= 40 ? "var(--noctra-amber)" : "var(--noctra-cyan)" }}>
                {coverageScore}%
              </span>
            </div>
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "var(--noctra-surface2)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${coverageScore}%`,
                  background: coverageScore >= 70 ? "var(--noctra-emerald)" : coverageScore >= 40 ? "var(--noctra-amber)" : "var(--noctra-cyan)",
                  boxShadow: `0 0 8px ${coverageScore >= 70 ? "var(--noctra-emerald)" : coverageScore >= 40 ? "var(--noctra-amber)" : "var(--noctra-cyan)"}44`,
                }}
              />
            </div>
          </div>
          <div className="space-y-1">
            {capabilityStatus.map((cs) => (
              <div key={cs.phase} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  {cs.percentage === 100 ? (
                    <Check size={8} style={{ color: "var(--noctra-emerald)" }} />
                  ) : cs.percentage > 0 ? (
                    <Circle size={8} style={{ color: "var(--noctra-amber)" }} />
                  ) : (
                    <Circle size={8} style={{ color: "var(--noctra-text-muted)" }} />
                  )}
                  <span className="text-[9px] truncate" style={{ color: "var(--noctra-text-muted)" }}>{cs.label}</span>
                </div>
                <span className="text-[9px] font-mono shrink-0" style={{ color: "var(--noctra-text-muted)" }}>{cs.used}/{cs.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t p-3 space-y-1" style={{ borderColor: "var(--noctra-border)" }}>
        {isDemoMode() && !collapsed && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg mb-1" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <Zap size={11} style={{ color: "var(--noctra-amber)" }} />
            <span className="text-xs" style={{ color: "var(--noctra-amber)" }}>Demo mode</span>
          </div>
        )}
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
            <Command size={11} style={{ color: "var(--noctra-text-muted)" }} />
            <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
              <kbd className="px-1 py-0.5 rounded text-[9px] font-mono" style={{ background: "var(--noctra-surface)", border: "1px solid var(--noctra-border)" }}>Ctrl+K</kbd> Quick nav
            </span>
          </div>
        )}
        {!collapsed && user && (
          <div className="px-2 pb-1">
            <p className="text-xs truncate" style={{ color: "var(--noctra-text-muted)" }}>{user.email}</p>
          </div>
        )}
        {confirmSignOut ? (
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="text-xs" style={{ color: "var(--noctra-rose)" }}>Sign out?</span>
            <button onClick={() => { signOut(); setConfirmSignOut(false); }} className="text-xs px-2 py-0.5 rounded font-medium" style={{ color: "#fff", background: "var(--noctra-rose)" }}>Yes</button>
            <button onClick={() => setConfirmSignOut(false)} className="text-xs px-2 py-0.5 rounded" style={{ color: "var(--noctra-text-muted)" }}>No</button>
          </div>
        ) : (
          <button onClick={() => setConfirmSignOut(true)} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors hover:bg-white/[0.03] text-left group" style={{ color: "var(--noctra-text-soft)" }}>
            <LogOut size={14} />
            {!collapsed && <span className="text-sm group-hover:text-[var(--noctra-rose)] transition-colors">Sign out</span>}
          </button>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--noctra-bg)" }}>
      <aside
        className="hidden md:flex flex-col shrink-0 border-r relative transition-all duration-200 ease-out"
        style={{ width: collapsed ? 56 : 232, borderColor: "var(--noctra-border)", background: "var(--noctra-surface)" }}
      >
        <SidebarContent collapsed={collapsed} />
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-5 w-6 h-6 rounded-full border flex items-center justify-center transition-colors hover:bg-white/[0.05] z-10"
          style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)", color: "var(--noctra-text-muted)" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft size={12} style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r z-10 animate-fade-in" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
            <div className="flex justify-end p-3">
              <button onClick={() => setMobileOpen(false)} style={{ color: "var(--noctra-text-soft)" }}><X size={18} /></button>
            </div>
            <SidebarContent collapsed={false} onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b shrink-0 z-10" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: "var(--noctra-text-soft)" }}><Menu size={20} /></button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "var(--noctra-cyan)" }}><Zap size={12} className="text-black" /></div>
            <span className="font-bold text-sm" style={{ color: "var(--noctra-text)" }}>DEVULTIMATE</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
