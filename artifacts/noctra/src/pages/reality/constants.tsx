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
  critical: "var(--noctra-rose)",
  high: "var(--noctra-rose)",
  medium: "var(--noctra-amber)",
  low: "var(--noctra-emerald)",
};

export const STATUS_CONFIG = {
  PASSED: { color: "var(--noctra-emerald)", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)", icon: CheckCircle, label: "COMPILE PASSED" },
  WARNING: { color: "var(--noctra-amber)", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: AlertCircle, label: "COMPILE WARNING" },
  FAILED: { color: "var(--noctra-rose)", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.3)", icon: XCircle, label: "COMPILE FAILED" },
};
