import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

export const SEV_COLOR: Record<string, string> = {
  critical: "var(--color-danger)",
  high: "var(--color-danger)",
  medium: "var(--color-warning)",
  low: "var(--color-success)",
};

export const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: typeof CheckCircle; label: string }> = {
  PASSED: { color: "var(--color-success)", bg: "var(--color-success-soft)", border: "var(--color-success-soft)", icon: CheckCircle, label: "COMPILE PASSED" },
  WARNING: { color: "var(--color-warning)", bg: "var(--color-warning-soft)", border: "var(--color-warning-soft)", icon: AlertCircle, label: "COMPILE WARNING" },
  FAILED: { color: "var(--color-danger)", bg: "var(--color-danger-soft)", border: "var(--color-danger-soft)", icon: XCircle, label: "COMPILE FAILED" },
};
