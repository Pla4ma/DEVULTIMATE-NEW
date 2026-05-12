import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--noctra-bg)" }}>
        <Loader2 className="animate-spin" size={24} style={{ color: "var(--noctra-cyan)" }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--noctra-bg)" }}>
        <Loader2 className="animate-spin" size={24} style={{ color: "var(--noctra-cyan)" }} />
      </div>
    );
  }

  return <>{children}</>;
}
