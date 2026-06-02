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
    <header
      className="sticky top-0 z-30 h-14 flex items-center justify-between px-5 backdrop-blur-xl"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(8,12,20,0.7)",
      }}
    >
      <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
      <div className="flex items-center gap-1">
        <button
          className="p-2.5 rounded-lg transition-all duration-200"
          style={{ color: "#5c6270" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
            (e.currentTarget as HTMLElement).style.color = "#8a8f9d";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "#5c6270";
          }}
        >
          <Search size={18} strokeWidth={1.5} />
        </button>
        <button
          className="p-2.5 rounded-lg transition-all duration-200 relative"
          style={{ color: "#5c6270" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
            (e.currentTarget as HTMLElement).style.color = "#8a8f9d";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "#5c6270";
          }}
        >
          <Bell size={18} strokeWidth={1.5} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "#0d9488" }}
          />
        </button>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center ml-1"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <User size={14} style={{ color: "#8a8f9d" }} strokeWidth={1.5} />
        </div>
      </div>
    </header>
  );
}
