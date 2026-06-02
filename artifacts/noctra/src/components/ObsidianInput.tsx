import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const inputBase =
  "w-full bg-obsidian-2 border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-teal/30 focus:ring-2 focus:ring-teal/10 hover:border-border-hover transition-colors duration-200";

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
  <textarea
    ref={ref}
    className={cn(inputBase, "resize-none", className)}
    {...props}
  />
));
ObsidianTextarea.displayName = "ObsidianTextarea";
