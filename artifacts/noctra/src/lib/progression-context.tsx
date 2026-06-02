import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
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

type ProgressionCtx = ProgressionState & {
  refreshProgression: () => Promise<void>;
};

const ProgressionContext = createContext<ProgressionCtx | null>(null);

async function loadProgression(): Promise<ProgressionState> {
  try {
    const reports = await getReports();
    const reportArr = (Array.isArray(reports) ? reports : []) as { tool: string }[];
    const count = reportArr.length;
    const tools = new Set(Array.from(reportArr.map((r) => r.tool).filter(Boolean)));
    return {
      reportCount: count,
      usedTools: tools,
      capabilityStatus: computeCapabilityStatus(tools),
      coverageScore: computeCoverageScore(tools),
      loaded: true,
    };
  } catch {
    return {
      reportCount: 0,
      usedTools: new Set(),
      capabilityStatus: [],
      coverageScore: 0,
      loaded: true,
    };
  }
}

export function ProgressionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressionState>({
    reportCount: 0,
    usedTools: new Set(),
    capabilityStatus: [],
    coverageScore: 0,
    loaded: false,
  });

  useEffect(() => {
    loadProgression().then(setState);
  }, []);

  const refreshProgression = useCallback(async () => {
    const newState = await loadProgression();
    setState(newState);
  }, []);

  return (
    <ProgressionContext.Provider value={{ ...state, refreshProgression }}>
      {children}
    </ProgressionContext.Provider>
  );
}

const DEFAULT_PROGRESSION: ProgressionState & { refreshProgression: () => Promise<void> } = {
  reportCount: 0,
  usedTools: new Set(),
  capabilityStatus: [],
  coverageScore: 0,
  loaded: false,
  refreshProgression: async () => {},
};

export function useProgression(): ProgressionState & { refreshProgression: () => Promise<void> } {
  const ctx = useContext(ProgressionContext);
  if (!ctx) return DEFAULT_PROGRESSION;
  return ctx;
}
