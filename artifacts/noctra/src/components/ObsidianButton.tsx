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
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-glow/50";

  const variants = {
      primary:
        "bg-teal text-obsidian-0 hover:bg-teal-deep active:scale-[0.98] shadow-[0_0_20px_rgba(45,212,191,0.15)]",
      secondary:
        "bg-transparent border border-border-default text-text-secondary hover:bg-obsidian-3 hover:border-border-hover active:bg-obsidian-2",
      ghost:
        "bg-transparent text-text-muted hover:text-text-secondary hover:bg-obsidian-2",
      danger:
        "bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-md",
    md: "px-4 py-2.5 text-sm rounded-md",
    lg: "px-6 py-3.5 text-sm rounded-lg",
  };

  return (
    <button
      className={cn(
        base,
        variants[variant],
        sizes[size],
        (disabled || isLoading) && "opacity-40 pointer-events-none",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      ) : (
        children
      )}
    </button>
  );
}
