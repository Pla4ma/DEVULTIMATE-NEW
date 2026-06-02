export type Phase = "idle" | "running" | "done" | "error";
export type Tab = "analysis" | "signals" | "score";

export type ProofSignalRow = {
  id: string; label: string; kind: string;
  value?: number | null; source?: string | null; evidence?: string | null;
  created_at?: string;
};
