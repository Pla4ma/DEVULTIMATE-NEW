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
        "rounded-xl p-6",
        hover && "card-premium",
        !hover && "bg-obsidian-2 border border-border-default",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
