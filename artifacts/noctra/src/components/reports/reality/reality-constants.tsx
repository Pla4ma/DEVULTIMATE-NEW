import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

export const SEV_COLOR: Record<string, string> = {
  critical: "var(--noctra-rose)",
  high: "var(--noctra-rose)",
  medium: "var(--noctra-amber)",
  low: "var(--noctra-emerald)",
};

export const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: typeof CheckCircle; label: string }> = {
  PASSED: { color: "var(--noctra-emerald)", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)", icon: CheckCircle, label: "COMPILE PASSED" },
  WARNING: { color: "var(--noctra-amber)", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: AlertCircle, label: "COMPILE WARNING" },
  FAILED: { color: "var(--noctra-rose)", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.3)", icon: XCircle, label: "COMPILE FAILED" },
};
