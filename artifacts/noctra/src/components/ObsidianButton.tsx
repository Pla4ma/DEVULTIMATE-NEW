import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  isLoading?: boolean;
}

export function ObsidianButton({
  variant = "primary",
  size = "md",
  children,
  isLoading,
  className,
  disabled,
  ...props
}: Props) {
  const base = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 active:scale-[0.98] relative overflow-hidden";

  const variants = {
    primary:
      "bg-aurora-gradient text-obsidian-0 font-semibold shadow-[0_0_24px_rgba(168,85,247,0.2)] hover:shadow-[0_0_40px_rgba(168,85,247,0.35)] hover:brightness-110 hover:-translate-y-0.5",
    secondary:
      "bg-white/5 backdrop-blur-md border border-white/10 text-text-primary hover:bg-white/10 hover:border-accent/30 hover:-translate-y-0.5",
    ghost:
      "text-text-muted hover:text-text-primary hover:bg-white/5",
    danger:
      "bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20",
  };

  const sizes = {
    sm: "px-3.5 py-2 text-xs rounded-lg",
    md: "px-5 py-2.5 text-sm rounded-lg",
    lg: "px-7 py-3.5 text-sm rounded-xl",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], (disabled || isLoading) && "opacity-40 pointer-events-none", className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> : children}
    </button>
  );
}
