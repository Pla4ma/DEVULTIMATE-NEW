import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { TOOLS, TOOL_GROUPS, type Tool } from "@/lib/noctra-tools";
import { LogOut, Menu, X, ChevronRight, Zap, Command } from "lucide-react";
import { CommandPalette } from "@/components/CommandPalette";

function NavItem({ tool, collapsed, onClick }: { tool: Tool; collapsed: boolean; onClick?: () => void }) {
  const [location] = useLocation();
  const active = location === tool.route || (tool.route !== "/app" && location.startsWith(tool.route));
  const Icon = tool.icon;

  return (
    <Link href={tool.route} onClick={onClick}>
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer group ${active ? "bg-white/5" : "hover:bg-white/3"}`}
        style={active ? { borderLeft: `2px solid ${tool.accent}` } : { borderLeft: "2px solid transparent" }}
      >
        <Icon
          className="shrink-0"
          size={16}
          style={{ color: active ? tool.accent : "var(--noctra-text-muted)" }}
        />
        {!collapsed && (
          <span
            className={`text-sm font-medium truncate transition-colors ${active ? "" : "group-hover:text-[var(--noctra-text)]"}`}
            style={{ color: active ? tool.accent : "var(--noctra-text-soft)" }}
          >
            {tool.diegetic}
          </span>
        )}
      </div>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const coreTools = TOOLS.filter((t) => t.group === "Core" && t.key !== "dashboard");
  const otherGroups = TOOL_GROUPS.filter((g) => g !== "Core");

  const SidebarContent = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b" style={{ borderColor: "var(--noctra-border)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--noctra-cyan)", boxShadow: "0 0 10px var(--noctra-cyan-glow)" }}>
          <Zap size={14} className="text-black" />
        </div>
        {!collapsed && <span className="font-bold text-sm tracking-wide" style={{ color: "var(--noctra-text)" }}>NOCTRA</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Dashboard */}
        <NavItem tool={TOOLS[0]} collapsed={collapsed} onClick={onNav} />

        {/* Core group */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--noctra-text-muted)" }}>Core</span>
          </div>
        )}
        {coreTools.map((t) => <NavItem key={t.key} tool={t} collapsed={collapsed} onClick={onNav} />)}

        {/* Other groups */}
        {otherGroups.map((group) => {
          const groupTools = TOOLS.filter((t) => t.group === group);
          return (
            <div key={group}>
              {!collapsed && (
                <div className="px-3 pt-3 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--noctra-text-muted)" }}>{group}</span>
                </div>
              )}
              {groupTools.map((t) => <NavItem key={t.key} tool={t} collapsed={collapsed} onClick={onNav} />)}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-3 space-y-1" style={{ borderColor: "var(--noctra-border)" }}>
        {!collapsed && user && (
          <div className="px-2 pb-2">
            <p className="text-xs truncate" style={{ color: "var(--noctra-text-muted)" }}>{user.email}</p>
          </div>
        )}
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg mb-1" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
            <Command size={11} style={{ color: "var(--noctra-text-muted)" }} />
            <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>⌘K command palette</span>
          </div>
        )}
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors hover:bg-white/5 text-left"
          style={{ color: "var(--noctra-text-soft)" }}
        >
          <LogOut size={14} />
          {!collapsed && <span className="text-sm">Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--noctra-bg)" }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col shrink-0 border-r relative transition-all duration-200"
        style={{ width: collapsed ? 56 : 220, borderColor: "var(--noctra-border)", background: "var(--noctra-surface)" }}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full border flex items-center justify-center transition-colors hover:bg-white/5"
          style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)", color: "var(--noctra-text-muted)" }}
        >
          <ChevronRight size={12} style={{ transform: collapsed ? "" : "rotate(180deg)" }} />
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
            <div className="flex justify-end p-3">
              <button onClick={() => setMobileOpen(false)} style={{ color: "var(--noctra-text-soft)" }}>
                <X size={18} />
              </button>
            </div>
            <SidebarContent onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b shrink-0" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: "var(--noctra-text-soft)" }}>
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "var(--noctra-cyan)" }}>
              <Zap size={12} className="text-black" />
            </div>
            <span className="font-bold text-sm" style={{ color: "var(--noctra-text)" }}>NOCTRA</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Global command palette */}
      <CommandPalette />
    </div>
  );
}
