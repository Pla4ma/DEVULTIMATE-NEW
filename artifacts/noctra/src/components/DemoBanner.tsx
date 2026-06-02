import { isDemoMode } from "@/lib/demo-mode";
import { Link } from "wouter";

export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium z-50 sticky top-0"
      style={{
        background: "var(--color-warning-soft)",
        color: "var(--color-warning)",
        borderBottom: "1px solid var(--color-warning)",
        backdropFilter: "blur(8px)",
      }}
    >
      <span className="flex items-center gap-2">
        <span role="img" aria-label="demo">🎭</span> 
        <span>Demo Mode — Using sample data.</span>
      </span>
      <span style={{ opacity: 0.8, display: "flex", alignItems: "center", gap: "6px" }}>
        <Link href="/auth" className="underline hover:opacity-100 transition-opacity ml-1 font-bold">
          Sign in
        </Link>
        to scan your own projects.
      </span>
    </div>
  );
}
