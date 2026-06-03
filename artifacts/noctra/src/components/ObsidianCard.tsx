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
        popular ? "glass-popular" : glass ? "glass" : "bg-void-2 border border-border-default",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
