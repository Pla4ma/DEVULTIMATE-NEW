import { useState, type ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { EXPERIENCES, EXPERIENCE_BY_KEY, type Experience, type ExperienceKey } from "@/lib/noctra-tools";
import { useProgression } from "@/lib/progression-context";
import { isDemoMode } from "@/lib/demo-mode";
import { CommandPalette } from "@/components/CommandPalette";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Menu, X, Zap, Command, Search, Sun, Moon,
  ChevronRight, Bell, Settings, User,
} from "lucide-react";

function ExperienceTab({ experience, active, onClick }: { experience: Experience; active: boolean; onClick: () => void }) {
  const Icon = experience.icon;

  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium"
      style={{
        color: active ? experience.accent : "var(--text-tertiary)",
        background: active ? `${experience.accent}10` : "transparent",
      }}
    >
      <Icon size={16} style={{ color: active ? experience.accent : "var(--text-tertiary)" }} />
      <span className="hidden lg:inline">{experience.short}</span>
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
          style={{ background: experience.accent }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  );
}

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { signOut, user } = useAuth();
  const [location, navigate] = useLocation();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentExperience = EXPERIENCES.find((e) =>
    location === e.route || (e.route !== "/app" && location.startsWith(e.route))
  ) ?? EXPERIENCES[0];

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("light", saved === "light");
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("light", newTheme === "light");
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b glass" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: "var(--text-secondary)" }}
            >
              <Menu size={18} />
            </button>

            <Link href="/app" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-glow" style={{ background: "var(--accent-cyan)" }}>
                <Zap size={16} className="text-black" />
              </div>
              <span className="font-bold text-sm tracking-wide hidden sm:inline" style={{ color: "var(--text-primary)" }}>DEVULTIMATE</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 ml-4">
              {EXPERIENCES.map((exp) => (
                <ExperienceTab
                  key={exp.key}
                  experience={exp}
                  active={currentExperience?.key === exp.key}
                  onClick={() => navigate(exp.route)}
                />
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}
            >
              <Search size={14} style={{ color: "var(--text-tertiary)" }} />
              <span className="text-xs hidden sm:inline" style={{ color: "var(--text-tertiary)" }}>Search...</span>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "var(--surface-1)", border: "1px solid var(--border-default)", color: "var(--text-quaternary)" }}>
                ⌘K
              </kbd>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: "var(--text-tertiary)" }}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button className="relative p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: "var(--text-tertiary)" }}>
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "var(--color-danger)" }} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg transition-colors hover:bg-white/5"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--accent-cyan)", color: "black" }}>
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </div>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl border overflow-hidden"
                    style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-lg)" }}
                  >
                    <div className="p-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{user?.email}</p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Pro Plan</p>
                    </div>
                    <div className="p-1">
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>
                        <User size={14} /> Profile
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>
                        <Settings size={14} /> Settings
                      </button>
                    </div>
                    <div className="p-1 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                      <button
                        onClick={() => { signOut(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
                        style={{ color: "var(--color-danger)" }}
                      >
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showCommandPalette && (
          <CommandPalette open={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location, navigate] = useLocation();

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 lg:hidden"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        exit={{ x: -280 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="absolute left-0 top-0 h-full w-72 border-r"
        style={{ background: "var(--surface-1)", borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-cyan)" }}>
              <Zap size={16} className="text-black" />
            </div>
            <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>DEVULTIMATE</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "var(--text-tertiary)" }}>
            <X size={18} />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {EXPERIENCES.map((exp) => {
            const Icon = exp.icon;
            const active = location === exp.route || (exp.route !== "/app" && location.startsWith(exp.route));
            return (
              <button
                key={exp.key}
                onClick={() => { navigate(exp.route); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left"
                style={{
                  background: active ? `${exp.accent}10` : "transparent",
                  color: active ? exp.accent : "var(--text-secondary)",
                }}
              >
                <Icon size={18} style={{ color: active ? exp.accent : "var(--text-tertiary)" }} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{exp.label}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>{exp.description}</p>
                </div>
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: exp.accent }} />
                )}
              </button>
            );
          })}
        </nav>
      </motion.aside>
    </motion.div>
  );
}

function BottomTabBar() {
  const [location, navigate] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t glass" style={{ borderColor: "var(--border-subtle)" }}>
      <div className="flex items-center justify-around h-16 px-2">
        {EXPERIENCES.map((exp) => {
          const Icon = exp.icon;
          const active = location === exp.route || (exp.route !== "/app" && location.startsWith(exp.route));
          return (
            <button
              key={exp.key}
              onClick={() => navigate(exp.route)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all"
              style={{ color: active ? exp.accent : "var(--text-quaternary)" }}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{exp.short}</span>
              {active && (
                <motion.div
                  layoutId="bottomTab"
                  className="absolute top-0 w-8 h-0.5 rounded-full"
                  style={{ background: exp.accent }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--surface-0)" }}>
      <TopBar onMenuClick={() => setMobileNavOpen(true)} />

      <AnimatePresence>
        {mobileNavOpen && (
          <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        )}
      </AnimatePresence>

      <main className="flex-1 pb-16 lg:pb-0">
        {children}
      </main>

      <BottomTabBar />
    </div>
  );
}
