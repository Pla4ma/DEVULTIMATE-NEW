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
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/20";

  const variants = {
    primary:
      "bg-teal text-obsidian-0 hover:brightness-110 active:scale-[0.98] shadow-[0_0_24px_rgba(13,148,136,0.12)]",
    secondary:
      "bg-transparent border text-text-secondary hover:text-text-primary hover:border-text-muted/30 active:bg-obsidian-2",
    ghost:
      "bg-transparent text-text-muted hover:text-text-secondary hover:bg-obsidian-2/50",
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
