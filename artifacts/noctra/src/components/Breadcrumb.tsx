import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export function Breadcrumb() {
  const [, navigate] = useLocation();
  return (
    <button onClick={() => navigate("/app")} className="flex items-center gap-1 text-xs hover:opacity-80 shrink-0" style={{ color: "var(--text-tertiary)" }}>
      <ArrowLeft size={11} /> Back to Launch Cockpit
    </button>
  );
}

export function BreadcrumbBar({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <Breadcrumb />
      {children}
    </div>
  );
}
