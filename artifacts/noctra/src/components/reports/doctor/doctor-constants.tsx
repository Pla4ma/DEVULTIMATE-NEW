import type { ReactNode } from "react";
import { Check, AlertTriangle, Shield } from "lucide-react";

export const GATE_ICON: Record<string, ReactNode> = {
  GREEN: <Check size={12} style={{ color: "var(--color-success)" }} />,
  YELLOW: <AlertTriangle size={12} style={{ color: "var(--color-warning)" }} />,
  RED: <Shield size={12} style={{ color: "var(--color-danger)" }} />,
};

export const GATE_COLOR: Record<string, string> = {
  GREEN: "var(--color-success)",
  YELLOW: "var(--color-warning)",
  RED: "var(--color-danger)",
};

export const SEV_COLOR: Record<string, string> = {
  CRITICAL: "var(--color-danger)", HIGH: "var(--color-warning)", MEDIUM: "var(--color-warning)", LOW: "var(--color-success)",
  error: "var(--color-danger)", warning: "var(--color-warning)", info: "var(--signal)",
};
