export function extractScore(data: Record<string, unknown> | null, tool: string): number | null {
  if (!data) return null;
  const scoreKeys = [
    `${tool}_score`, "signal_score", "health_score", "proof_score",
    "mvp_score", "swarm_score", "launch_score", "reality_score", "readiness_score", "score",
  ];
  for (const key of scoreKeys) {
    const val = data[key];
    if (typeof val === "number" && !isNaN(val)) {
      return Math.min(100, Math.max(0, Math.round(val)));
    }
  }
  return null;
}

export function extractTitle(data: Record<string, unknown> | null, tool: string, input: string): string {
  if (data?.title && typeof data.title === "string" && data.title.trim()) {
    return data.title.trim();
  }
  if (data?.verdict && typeof data.verdict === "string") {
    const v = data.verdict.trim();
    if (v.length <= 80) return v;
  }
  const toolLabels: Record<string, string> = {
    idea: "Signal Chamber", reality: "Pressure Matrix", mvp: "Blueprint Board",
    proof: "Proof Reactor", swarm: "Swarm Field", doctor: "Diagnostic Bay",
    launch: "Launch Control", twin: "Memory Constellation",
  };
  const label = toolLabels[tool] ?? tool;
  const inputSnippet = input.split("\n")[0].slice(0, 60);
  return `${label} — ${inputSnippet}${input.length > 60 ? "…" : ""}`;
}

export function extractSummary(data: Record<string, unknown> | null, raw: string): string {
  if (data?.summary && typeof data.summary === "string" && data.summary.trim()) {
    return data.summary.trim().slice(0, 500);
  }
  if (data?.verdict && typeof data.verdict === "string" && data.verdict.trim()) {
    return data.verdict.trim().slice(0, 500);
  }
  const afterJson = raw.slice(raw.lastIndexOf("}") + 1).trim();
  if (afterJson.length > 20) return afterJson.slice(0, 200);
  return raw.slice(0, 200);
}
