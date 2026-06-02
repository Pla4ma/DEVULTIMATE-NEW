import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface VoidCardProps {
  children: ReactNode;
  className?: string;
  featured?: boolean;
  hover?: boolean;
}

export function VoidCard({
  children,
  className,
  featured = false,
  hover = true,
}: VoidCardProps) {
  return (
    <motion.div
      whileHover={
        hover
          ? {
              y: -4,
              borderColor: "rgba(255, 159, 28, 0.30)",
            }
          : undefined
      }
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "bg-void-1 border border-void-3 rounded-[12px] transition-colors duration-300",
        featured ? "p-12" : "p-8",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
