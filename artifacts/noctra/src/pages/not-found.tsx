import { useLocation } from "wouter";
import { ArrowLeft, Zap } from "lucide-react";

export default function NotFound() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: "var(--noctra-bg)" }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--noctra-cyan)" }}>
        <Zap size={24} className="text-black" />
      </div>
      <div className="text-center">
        <p className="text-6xl font-bold mb-2" style={{ color: "var(--noctra-text)" }}>404</p>
        <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>This signal does not exist</p>
      </div>
      <button
        onClick={() => navigate("/app")}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: "var(--noctra-surface)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)" }}
      >
        <ArrowLeft size={14} /> Return to Command Center
      </button>
    </div>
  );
}
