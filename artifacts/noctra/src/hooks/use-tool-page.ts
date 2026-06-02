import { useState, useCallback, useEffect } from "react";

export type ToolPhase = "idle" | "running" | "done" | "error";

export interface ToolModeConfig {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
  description: string;
}

interface UseToolPageConfig<M extends string> {
  modes: readonly ToolModeConfig[];
  initialMode?: M;
  onRun: () => Promise<void>;
}

interface UseToolPageReturn<M extends string> {
  mode: M;
  setMode: (mode: M) => void;
  phase: ToolPhase;
  setPhase: (phase: ToolPhase) => void;
  input: string;
  setInput: (input: string) => void;
  error: string;
  setError: (error: string) => void;
  savedReportId: string | null;
  setSavedReportId: (id: string | null) => void;
  run: () => Promise<void>;
  reset: () => void;
  currentMode: ToolModeConfig;
}

export function useToolPage<M extends string>(config: UseToolPageConfig<M>): UseToolPageReturn<M> {
  const { modes, initialMode, onRun } = config;
  const [mode, setMode] = useState<M>(initialMode ?? (modes[0]?.key as M));
  const [phase, setPhase] = useState<ToolPhase>("idle");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [savedReportId, setSavedReportId] = useState<string | null>(null);

  const currentMode = modes.find((m) => m.key === mode) ?? modes[0]!;

  const run = useCallback(async () => {
    setPhase("running");
    setError("");
    setSavedReportId(null);
    try {
      await onRun();
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
      setPhase("error");
    }
  }, [onRun]);

  const reset = useCallback(() => {
    setPhase("idle");
    setError("");
    setSavedReportId(null);
    setInput("");
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (phase === "idle" && input.trim()) void run();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [phase, input, run]);

  return {
    mode,
    setMode,
    phase,
    setPhase,
    input,
    setInput,
    error,
    setError,
    savedReportId,
    setSavedReportId,
    run,
    reset,
    currentMode,
  };
}
