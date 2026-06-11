import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Lightbulb, Stethoscope, Hammer, Brain,
  Menu, X, Settings, LogOut,
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
      <div className="flex items-center justify-center h-14 border-b" style={{ borderColor: "rgba(139,92,246,0.08)" }}>
        <span className="text-sm font-bold tracking-widest" style={{ color: "#a78bfa" }}>N</span>
      </div>

      <nav className="flex-1 py-5 px-2.5 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center justify-center px-2 py-3 rounded-lg cursor-pointer transition-all duration-300 relative group",
                  isActive ? "" : "hover:bg-white/5"
                )}
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(249,115,22,0.04) 100%)"
                    : "transparent",
                  color: isActive ? "#a78bfa" : "rgba(255,255,255,0.4)",
                  border: isActive
                    ? "1px solid rgba(139,92,246,0.2)"
                    : "1px solid transparent",
                }}
                title={item.label}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                    style={{ background: "linear-gradient(180deg, #8b5cf6 0%, #f97316 100%)", boxShadow: "0 0 8px rgba(139,92,246,0.4)" }} />
                )}
                <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-2.5 pb-5 space-y-1">
        <div
          className="flex items-center justify-center px-2 py-3 rounded-lg cursor-pointer transition-all duration-300 hover:bg-white/5"
          style={{ color: "rgba(255,255,255,0.4)" }}
          title="Settings"
        >
          <Settings size={20} strokeWidth={1.5} />
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center px-2 py-3 rounded-lg transition-all duration-300 hover:bg-white/5"
          style={{ color: "rgba(255,255,255,0.4)" }}
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
      <aside
        className="hidden lg:flex fixed top-0 left-0 bottom-0 z-40 w-[4.5rem] flex-col border-r"
        style={{
          background: "rgba(21, 16, 48, 0.85)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(139,92,246,0.08)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-3.5 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg"
          style={{ background: "rgba(20,18,40,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(139,92,246,0.1)", color: "#a78bfa" }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="w-64 h-full border-r"
            style={{
              background: "rgba(21, 16, 48, 0.95)",
              backdropFilter: "blur(20px)",
              borderColor: "rgba(139,92,246,0.1)",
            }}
          >
            <SidebarContent />
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
