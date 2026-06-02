import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { LogoMark } from "@/components/Logo";

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--surface-0)" }}>
        <LogoMark size={48} animated />
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" style={{ color: "var(--signal)" }} />
          <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>Loading your workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--surface-0)" }}>
        <LogoMark size={48} animated />
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" style={{ color: "var(--signal)" }} />
          <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>Redirecting to sign in...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
