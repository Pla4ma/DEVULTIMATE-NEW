import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
  { icon: LayoutDashboard, label: "Command Center", href: "/app" },
  { icon: Lightbulb, label: "Idea Lab", href: "/app/idea-lab" },
  { icon: Stethoscope, label: "Code Health", href: "/app/code-health" },
  { icon: Hammer, label: "Build Planner", href: "/app/build" },
  { icon: Brain, label: "Project Brain", href: "/app/brain" },
];

export function VoidNavSidebar() {
  const [location] = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useAuth();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 h-14 border-b border-void-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg hover:bg-void-2 transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <Menu size={18} />
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer relative",
                  isActive
                    ? "text-[var(--signal-amber)]"
                    : "text-text-tertiary hover:text-text-secondary hover:bg-void-2"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-[var(--signal-amber)]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon size={20} />
                {expanded && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-void-3 p-3 space-y-1">
        <button
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-void-2 transition-all w-full"
        >
          <Settings size={20} />
          {expanded && <span className="text-sm font-medium">Settings</span>}
        </button>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-void-2 transition-all w-full"
        >
          <LogOut size={20} />
          {expanded && <span className="text-sm font-medium">Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 border-r border-void-3 bg-void-1 transition-all duration-300",
          expanded ? "w-60" : "w-[72px]"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-void-1 border border-void-3"
        style={{ color: "var(--text-secondary)" }}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-void-0/80"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 h-full w-60 z-50 bg-void-1 border-r border-void-3"
            >
              <div className="flex items-center justify-between px-4 h-14 border-b border-void-3">
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  NOCTRA
                </span>
                <button onClick={() => setMobileOpen(false)}>
                  <X size={18} style={{ color: "var(--text-secondary)" }} />
                </button>
              </div>
              <div className="p-3" onClick={() => setMobileOpen(false)}>
                <SidebarContent />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
