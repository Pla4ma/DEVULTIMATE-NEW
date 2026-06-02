import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const inputBase =
  "w-full bg-obsidian-2 border border-border-default rounded-md px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-signal focus:ring-2 focus:ring-signal-glow/30 hover:border-border-strong transition-colors duration-150";

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
