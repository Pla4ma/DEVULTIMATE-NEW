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
      className="sticky top-0 z-30 h-14 flex items-center justify-between px-5"
      style={{
        borderBottom: "1px solid rgba(139,92,246,0.08)",
        background: "rgba(21, 16, 48, 0.7)",
        backdropFilter: "blur(20px)",
      }}
    >
      <h1 className="text-sm font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-1">
        <button className="p-2.5 rounded-lg transition-all duration-300 relative group" style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "#a78bfa"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}>
          <Search size={18} strokeWidth={1.5} />
        </button>
        <button className="p-2.5 rounded-lg transition-all duration-300 relative" style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "#a78bfa"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}>
          <Bell size={18} strokeWidth={1.5} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#f97316", boxShadow: "0 0 6px rgba(249,115,22,0.5)" }} />
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center ml-1"
          style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <User size={14} style={{ color: "#a78bfa" }} strokeWidth={1.5} />
        </div>
      </div>
    </header>
  );
}
