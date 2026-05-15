import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getReports } from "@/lib/repository";
import {
  getUnlockedTools,
  getNextMilestone,
  getMilestoneProgress,
  type Milestone,
} from "@/lib/progression";
import type { ToolKey } from "@/lib/noctra-tools";

type ProgressionState = {
  reportCount: number;
  unlockedTools: Set<ToolKey>;
  nextMilestone: Milestone | null;
  progress: { current: string; progress: number; total: number; label: string };
  loaded: boolean;
};

const ProgressionContext = createContext<ProgressionState | null>(null);

export function ProgressionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressionState>({
    reportCount: 0,
    unlockedTools: new Set<ToolKey>(),
    nextMilestone: null,
    progress: { current: "", progress: 0, total: 1, label: "Loading..." },
    loaded: false,
  });

  useEffect(() => {
    getReports()
      .then((reports) => {
        const count = Array.isArray(reports) ? reports.length : 0;
        setState({
          reportCount: count,
          unlockedTools: getUnlockedTools(count),
          nextMilestone: getNextMilestone(count),
          progress: getMilestoneProgress(count),
          loaded: true,
        });
      })
      .catch(() => {
        setState((prev) => ({ ...prev, loaded: true }));
      });
  }, []);

  return (
    <ProgressionContext.Provider value={state}>
      {children}
    </ProgressionContext.Provider>
  );
}

export function useProgression(): ProgressionState {
  const ctx = useContext(ProgressionContext);
  if (!ctx) throw new Error("useProgression must be used within ProgressionProvider");
  return ctx;
}
