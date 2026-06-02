import { useLocation } from "wouter";
import { Search, Bell, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function VoidTopBar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const pageTitles: Record<string, string> = {
    "/app": "Command Center",
    "/app/idea-lab": "Idea Lab",
    "/app/code-health": "Code Health",
    "/app/build": "Build Planner",
    "/app/brain": "Project Brain",
  };

  const title = pageTitles[location] || "NOCTRA";

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-void-3 bg-void-0/80 backdrop-blur-xl flex items-center justify-between px-4">
      <h1 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h1>
      <div className="flex items-center gap-3">
        <button
          className="p-2 rounded-lg hover:bg-void-2 transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          <Search size={18} />
        </button>
        <button
          className="p-2 rounded-lg hover:bg-void-2 transition-colors relative"
          style={{ color: "var(--text-tertiary)" }}
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-signal-amber" />
        </button>
        <div
          className="w-8 h-8 rounded-full bg-void-2 border border-void-3 flex items-center justify-center"
        >
          <User size={16} style={{ color: "var(--text-secondary)" }} />
        </div>
      </div>
    </header>
  );
}
