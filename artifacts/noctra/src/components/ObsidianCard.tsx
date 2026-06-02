import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function ObsidianCard({
  children,
  className,
  hover = true,
  ...props
}: Props) {
  return (
    <div
      className={cn(
        "bg-obsidian-2 border border-border-default rounded-xl",
        hover &&
          "transition-all duration-200 hover:border-border-strong hover:-translate-y-px",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
