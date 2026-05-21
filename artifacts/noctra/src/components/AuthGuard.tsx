import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Loader2, Zap } from "lucide-react";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--noctra-bg)" }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--noctra-cyan)", boxShadow: "0 0 30px var(--noctra-cyan-glow)" }}>
          <Zap size={22} className="text-black" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" style={{ color: "var(--noctra-cyan)" }} />
          <span className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>Loading your workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--noctra-bg)" }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--noctra-cyan)", boxShadow: "0 0 30px var(--noctra-cyan-glow)" }}>
          <Zap size={22} className="text-black" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" style={{ color: "var(--noctra-cyan)" }} />
          <span className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>Redirecting to sign in...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
