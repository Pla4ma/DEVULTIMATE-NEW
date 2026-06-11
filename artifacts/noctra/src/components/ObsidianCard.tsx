import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  popular?: boolean;
  glass?: boolean;
}

export function ObsidianCard({
  children, className, hover, popular = false, glass = true, ...props
}: Props) {
  return (
    <div
      className={cn(
        "p-6",
        popular ? "glass-popular" : glass ? "glass" : "",
        className
      )}
      style={{
        ...(popular
          ? {
              background: "rgba(20, 18, 40, 0.6)",
              backdropFilter: "blur(20px) saturate(160%)",
              border: "1px solid rgba(249, 115, 22, 0.2)",
              borderTop: "1px solid rgba(249, 115, 22, 0.3)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(249,115,22,0.06)",
              borderRadius: "var(--radius-lg)",
            }
          : glass
            ? {
                background: "rgba(20, 18, 40, 0.5)",
                backdropFilter: "blur(16px) saturate(150%)",
                border: "1px solid rgba(139, 92, 246, 0.12)",
                borderTop: "1px solid rgba(139, 92, 246, 0.15)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.3)",
                borderRadius: "var(--radius-lg)",
                transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              }
            : { background: "var(--surface-1)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)" }
        ),
      }}
      {...props}
    >
      {children}
    </div>
  );
}
