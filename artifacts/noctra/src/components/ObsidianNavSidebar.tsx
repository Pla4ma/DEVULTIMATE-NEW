import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Lightbulb,
  Stethoscope,
  Hammer,
  Brain,
  Menu,
  X,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/app" },
  { icon: Lightbulb, label: "Idea Lab", href: "/app/idea-lab" },
  { icon: Stethoscope, label: "Code Health", href: "/app/code-health" },
  { icon: Hammer, label: "Build Planner", href: "/app/build" },
  { icon: Brain, label: "Project Brain", href: "/app/brain" },
];

export function ObsidianNavSidebar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useAuth();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-12 border-b border-border-default">
        <span className="text-xs font-bold tracking-widest text-teal">N</span>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center justify-center px-2 py-2.5 rounded-md cursor-pointer transition-all duration-150 relative group",
                  isActive
                    ? "text-teal bg-teal-dim"
                    : "text-text-tertiary hover:text-text-secondary hover:bg-obsidian-2"
                )}
                title={item.label}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-teal" />
                )}
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-default p-2 space-y-1">
        <button
          className="flex items-center justify-center w-full px-2 py-2.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-obsidian-2 transition-all"
          title="Settings"
        >
          <Settings size={20} />
        </button>
        <button
          onClick={() => signOut()}
          className="flex items-center justify-center w-full px-2 py-2.5 rounded-md text-text-tertiary hover:text-danger hover:bg-danger/10 transition-all"
          title="Sign out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-16 z-40 border-r border-border-default bg-obsidian-1">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-obsidian-2 border border-border-default text-text-secondary"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-full w-60 z-50 bg-obsidian-1 border-r border-border-default">
            <div className="flex items-center justify-between px-4 h-12 border-b border-border-default">
              <span className="text-sm font-bold text-teal">NOCTRA</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-text-secondary"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-3" onClick={() => setMobileOpen(false)}>
              <div className="flex flex-col h-full">
                <nav className="flex-1 py-2 space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all",
                            isActive
                              ? "text-teal bg-teal-dim"
                              : "text-text-tertiary hover:text-text-secondary hover:bg-obsidian-2"
                          )}
                        >
                          {isActive && (
                            <div className="w-0.5 h-5 rounded-full bg-teal" />
                          )}
                          <item.icon
                            size={18}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
                <div className="border-t border-border-default pt-2 space-y-1">
                  <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-obsidian-2 transition-all">
                    <Settings size={18} />
                    <span className="text-sm">Settings</span>
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-text-tertiary hover:text-danger hover:bg-danger/10 transition-all"
                  >
                    <LogOut size={18} />
                    <span className="text-sm">Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
