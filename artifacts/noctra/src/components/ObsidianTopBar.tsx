import { useLocation } from "wouter";
import { Search, Bell, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function ObsidianTopBar() {
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
    <header className="sticky top-0 z-30 h-12 border-b border-border-subtle flex items-center justify-between px-4 bg-obsidian-1/80">
      <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-obsidian-2 transition-colors">
          <Search size={18} />
        </button>
        <button className="p-2 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-obsidian-2 transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-teal" />
        </button>
        <div className="w-7 h-7 rounded-full bg-obsidian-3 border border-border-default flex items-center justify-center">
          <User size={14} className="text-text-secondary" />
        </div>
      </div>
    </header>
  );
}
