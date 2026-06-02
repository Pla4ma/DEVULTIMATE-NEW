import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const inputBase = "w-full bg-void-2 border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 hover:border-border-hover transition-all duration-300";

export const ObsidianInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputBase, className)} {...props} />
));
ObsidianInput.displayName = "ObsidianInput";

export const ObsidianTextarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(inputBase, "resize-none", className)} {...props} />
));
ObsidianTextarea.displayName = "ObsidianTextarea";
