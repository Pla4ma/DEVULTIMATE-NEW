import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getReports } from "@/lib/repository";
import {
  computeCapabilityStatus,
  computeCoverageScore,
  type CapabilityStatus,
} from "@/lib/progression";
import type { ToolKey } from "@/lib/noctra-tools";

type ProgressionState = {
  reportCount: number;
  usedTools: Set<string>;
  capabilityStatus: CapabilityStatus[];
  coverageScore: number;
  loaded: boolean;
};

const ProgressionContext = createContext<ProgressionState | null>(null);

export function ProgressionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressionState>({
    reportCount: 0,
    usedTools: new Set(),
    capabilityStatus: [],
    coverageScore: 0,
    loaded: false,
  });

  useEffect(() => {
    getReports()
      .then((reports) => {
        const count = Array.isArray(reports) ? reports.length : 0;
        const tools = new Set(
          Array.isArray(reports)
            ? reports.map((r: { tool: string }) => r.tool).filter(Boolean)
            : []
        );
        setState({
          reportCount: count,
          usedTools: tools,
          capabilityStatus: computeCapabilityStatus(tools),
          coverageScore: computeCoverageScore(tools),
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
