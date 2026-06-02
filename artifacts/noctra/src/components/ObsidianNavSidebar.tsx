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
      <div className="flex items-center justify-center h-14 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <span className="text-sm font-bold tracking-widest" style={{ color: "#0d9488" }}>N</span>
      </div>

      <nav className="flex-1 py-5 px-2.5 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center justify-center px-2 py-3 rounded-lg cursor-pointer transition-all duration-200 relative group",
                  isActive
                    ? "text-teal"
                    : "hover:bg-obsidian-2"
                )}
                style={{
                  background: isActive ? "rgba(13,148,136,0.06)" : "transparent",
                  color: isActive ? "#0d9488" : "#5c6270",
                }}
                title={item.label}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ background: "#0d9488" }} />
                )}
                <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2.5 space-y-1" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <button
          className="flex items-center justify-center w-full px-2 py-3 rounded-lg transition-all duration-200"
          style={{ color: "#5c6270" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          title="Settings"
        >
          <Settings size={20} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => signOut()}
          className="flex items-center justify-center w-full px-2 py-3 rounded-lg transition-all duration-200 hover:bg-red-500/10"
          style={{ color: "#5c6270" }}
          title="Sign out"
        >
          <LogOut size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[4.5rem] z-40 border-r bg-obsidian-1" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-obsidian-2 border text-text-secondary"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
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
          <aside className="lg:hidden fixed left-0 top-0 h-full w-60 z-50 bg-obsidian-1 border-r" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <div className="flex items-center justify-between px-4 h-14 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <span className="text-sm font-bold" style={{ color: "#0d9488" }}>NOCTRA</span>
              <button
                onClick={() => setMobileOpen(false)}
                style={{ color: "#5c6270" }}
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
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
                            isActive ? "text-teal" : "hover:bg-obsidian-2"
                          )}
                          style={{
                            background: isActive ? "rgba(13,148,136,0.06)" : "transparent",
                            color: isActive ? "#0d9488" : "#5c6270",
                          }}
                        >
                          {isActive && (
                            <div className="w-0.5 h-5 rounded-full" style={{ background: "#0d9488" }} />
                          )}
                          <item.icon
                            size={18}
                            strokeWidth={isActive ? 2 : 1.5}
                          />
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
                <div className="border-t pt-2 space-y-1" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-obsidian-2" style={{ color: "#5c6270" }}>
                    <Settings size={18} strokeWidth={1.5} />
                    <span className="text-sm">Settings</span>
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-red-500/10"
                    style={{ color: "#5c6270" }}
                  >
                    <LogOut size={18} strokeWidth={1.5} />
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
