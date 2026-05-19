import type { ReactNode } from "react";
import { Check, AlertTriangle, Shield } from "lucide-react";

export const GATE_ICON: Record<string, ReactNode> = {
  GREEN: <Check size={12} style={{ color: "var(--noctra-emerald)" }} />,
  YELLOW: <AlertTriangle size={12} style={{ color: "var(--noctra-amber)" }} />,
  RED: <Shield size={12} style={{ color: "var(--noctra-rose)" }} />,
};

export const GATE_COLOR: Record<string, string> = {
  GREEN: "var(--noctra-emerald)",
  YELLOW: "var(--noctra-amber)",
  RED: "var(--noctra-rose)",
};

export const SEV_COLOR: Record<string, string> = {
  CRITICAL: "var(--noctra-rose)", HIGH: "var(--noctra-amber)", MEDIUM: "var(--noctra-amber)", LOW: "var(--noctra-emerald)",
  error: "var(--noctra-rose)", warning: "var(--noctra-amber)", info: "var(--noctra-cyan)",
};
