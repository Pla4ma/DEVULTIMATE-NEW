import { motion } from "framer-motion";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface VoidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  isLoading?: boolean;
}

const variantStyles = {
  primary:
    "bg-signal-amber text-black font-semibold hover:shadow-[0_0_24px_var(--signal-amber-glow)]",
  secondary:
    "bg-void-2 text-text-secondary border border-void-3 hover:border-[var(--signal-amber-glow)] hover:bg-void-3",
  ghost: "bg-transparent text-text-tertiary hover:text-text-secondary",
  danger: "bg-red-500 text-white font-semibold",
};

const sizeStyles = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-7 py-3.5 text-base rounded-xl",
};

export function VoidButton({
  variant = "primary",
  size = "md",
  children,
  isLoading,
  className,
  disabled,
  ...props
}: VoidButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-200",
        variantStyles[variant],
        sizeStyles[size],
        (disabled || isLoading) && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
      ) : (
        children
      )}
    </motion.button>
  );
}
