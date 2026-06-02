import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export const VoidInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full bg-void-2 border border-void-3 rounded-[10px] px-4 py-3 text-sm",
        "text-text-primary placeholder:text-text-quaternary",
        "focus:outline-none focus:border-signal-amber focus:shadow-[0_0_0_3px_var(--signal-amber-dim)]",
        "transition-all duration-200",
        className
      )}
      {...props}
    />
  );
});
VoidInput.displayName = "VoidInput";
