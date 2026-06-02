import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import type { CompileMode } from "./types";

export const COMPILE_MODES: Array<{ key: CompileMode; label: string; desc: string }> = [
  { key: "full", label: "Full", desc: "All-spectrum compilation" },
  { key: "idea", label: "Idea", desc: "Market, timing, founder-fit" },
  { key: "mvp", label: "MVP", desc: "Scope, shippability, timeline" },
  { key: "retention", label: "Retention", desc: "Why users come back" },
  { key: "monetization", label: "Monetization", desc: "Will anyone pay?" },
  { key: "ai-wrapper", label: "AI Wrapper", desc: "ChatGPT replacement risk" },
  { key: "launch", label: "Launch", desc: "Channels, Day-1 traction" },
];

export const SEV_COLOR: Record<string, string> = {
  critical: "var(--color-danger)",
  high: "var(--color-danger)",
  medium: "var(--color-warning)",
  low: "var(--color-success)",
};

export const STATUS_CONFIG = {
  PASSED: { color: "var(--color-success)", bg: "var(--color-success-soft)", border: "var(--color-success-soft)", icon: CheckCircle, label: "COMPILE PASSED" },
  WARNING: { color: "var(--color-warning)", bg: "var(--color-warning-soft)", border: "var(--color-warning-soft)", icon: AlertCircle, label: "COMPILE WARNING" },
  FAILED: { color: "var(--color-danger)", bg: "var(--color-danger-soft)", border: "var(--color-danger-soft)", icon: XCircle, label: "COMPILE FAILED" },
};
