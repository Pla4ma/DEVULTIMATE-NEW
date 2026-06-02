import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  popular?: boolean;
}

export function ObsidianCard({
  children,
  className,
  hover = true,
  popular = false,
  ...props
}: Props) {
  return (
    <div
      className={cn(
        "rounded-xl p-6",
        popular
          ? "card-premium-popular"
          : hover
          ? "card-premium"
          : "bg-obsidian-2 border border-border-default",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
