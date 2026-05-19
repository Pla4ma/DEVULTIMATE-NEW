export function buildDoctorUserContent(userInput: string, context: Record<string, unknown>): string {
  const parts: string[] = [];
  if (userInput.trim()) parts.push(`Founder notes:\n${userInput}`);

  const scanData = context.scanData as Record<string, unknown> | undefined;
  if (scanData) {
    const signals = scanData.staticSignals as Record<string, unknown> | undefined;
    if (signals) {
      parts.push(`Static signals (deterministic scanner facts — not AI guesses):\n${JSON.stringify(signals, null, 2)}`);
    }

    const sm = (scanData.summaryMarkdown ?? scanData.summary_markdown) as string | undefined;
    if (sm) parts.push(`Scan summary:\n${sm}`);

    const evidence = scanData.evidenceIndex as unknown[] | undefined;
    if (Array.isArray(evidence) && evidence.length > 0) {
      parts.push(`Evidence index (deterministic findings from scan):\n${JSON.stringify(evidence.slice(0, 15), null, 2)}`);
    }

    const repoMap = scanData.repoMap as Record<string, unknown> | undefined;
    if (repoMap) {
      parts.push(`Repository map (file categorization):\n${JSON.stringify(repoMap, null, 2)}`);
    }

    const scripts = scanData.scripts as Record<string, unknown> | undefined;
    if (scripts && Object.keys(scripts).length > 0) {
      parts.push(`Package scripts:\n${JSON.stringify(scripts, null, 2)}`);
    }

    if (Array.isArray(evidence) && evidence.length > 0) {
      const highValueSnippets = evidence
        .filter((e) => (e as Record<string, unknown>).severity === "error")
        .slice(0, 5)
        .map((e) => {
          const item = e as Record<string, unknown>;
          return `[${item.severity}] ${item.signal} in ${item.filePath}${item.lineNumber ? `:${item.lineNumber}` : ""}\n  ${String(item.snippet ?? "").slice(0, 200)}`;
        });
      if (highValueSnippets.length > 0) {
        parts.push(`High-severity evidence details:\n${highValueSnippets.join("\n")}`);
      }
    }
  }

  const launchGates = context.launchGates as unknown[] | undefined;
  if (Array.isArray(launchGates) && launchGates.length > 0) {
    parts.push(`Static launch gate results (deterministic — scanner finds facts, AI explains consequences):\n${JSON.stringify(launchGates, null, 2)}`);
  }

  return parts.join("\n\n=====\n\n");
}
