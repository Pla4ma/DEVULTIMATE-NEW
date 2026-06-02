import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

interface VoidToastProps {
  show: boolean;
  children: ReactNode;
  variant?: "info" | "success" | "error";
  onClose?: () => void;
}

const borderColors = {
  info: "var(--signal-amber)",
  success: "var(--color-success)",
  error: "var(--color-danger)",
};

export function VoidToast({ show, children, variant = "info", onClose }: VoidToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-50 bg-void-2 border-l-[3px] rounded-xl p-4 max-w-sm shadow-lg"
          style={{ borderLeftColor: borderColors[variant] }}
        >
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {children}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-text-quaternary hover:text-text-secondary"
            >
              ×
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
