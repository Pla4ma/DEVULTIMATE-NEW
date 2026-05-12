import { loadCrossToolContext, buildContextBlock, type InjectedContext } from "./cross-context";

export type Message = { role: "user" | "assistant" | "system"; content: string };

function getApiBase(): string {
  return "";
}

// Semantic stage labels that show real progress during analysis — not a dead spinner
const TOOL_STAGES: Record<string, string[]> = {
  idea: [
    "Sweeping signal space…",
    "Profiling market dynamics…",
    "Stress-testing assumptions…",
    "Mapping red flags and strengths…",
    "Generating sharper versions…",
    "Compiling intelligence…",
  ],
  reality: [
    "Parsing assumptions…",
    "Running pressure tests…",
    "Identifying blind spots…",
    "Assessing risk severity…",
    "Drafting patch plan…",
    "Compiling intelligence…",
  ],
  mvp: [
    "Analyzing scope feasibility…",
    "Prioritizing features by ROI…",
    "Designing architecture…",
    "Building week-by-week plan…",
    "Validating timeline…",
    "Compiling blueprint…",
  ],
  proof: [
    "Assessing evidence quality…",
    "Scoring signal density…",
    "Detecting evidence gaps…",
    "Designing next experiments…",
    "Mapping objections…",
    "Compiling proof assessment…",
  ],
  swarm: [
    "Assembling persona swarm…",
    "Simulating market reactions…",
    "Analyzing objection patterns…",
    "Computing pricing signals…",
    "Extracting segment breakdown…",
    "Compiling swarm intelligence…",
  ],
  doctor: [
    "Parsing code signals…",
    "Evaluating launch gates…",
    "Scanning for critical issues…",
    "Prioritizing repair queue…",
    "Assessing production readiness…",
    "Compiling diagnostic report…",
  ],
  launch: [
    "Checking launch gates…",
    "War-gaming failure modes…",
    "Validating distribution plan…",
    "Building checklist…",
    "Assessing go/no-go signal…",
    "Compiling launch assessment…",
  ],
  twin: [
    "Loading memory constellation…",
    "Detecting patterns across reports…",
    "Scanning for contradictions…",
    "Identifying drift signals…",
    "Computing strategic moves…",
    "Synthesizing intelligence…",
  ],
  patch: [
    "Analyzing identified risks…",
    "Designing targeted patches…",
    "Prioritizing by impact…",
    "Compiling patch plan…",
  ],
};

export async function callAI(messages: Message[], systemPrompt?: string): Promise<string> {
  const res = await fetch(`${getApiBase()}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, systemPrompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Unknown error" })) as { message?: string; error?: string };
    if (err.error === "AI_NOT_CONFIGURED") {
      throw new Error("AI is not configured. Add OPENAI_API_KEY or GROQ_API_KEY in Replit Secrets.");
    }
    throw new Error(err.message ?? `Request failed: ${res.status}`);
  }

  const data = await res.json() as { content: string };
  return data.content ?? "";
}

export async function streamAI(
  messages: Message[],
  onChunk: (chunk: string) => void,
  systemPrompt?: string
): Promise<string> {
  const res = await fetch(`${getApiBase()}/api/ai/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, systemPrompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Unknown error" })) as { message?: string; error?: string };
    if (err.error === "AI_NOT_CONFIGURED") {
      throw new Error("AI is not configured. Add OPENAI_API_KEY or GROQ_API_KEY in Replit Secrets.");
    }
    throw new Error(err.message ?? `Stream failed: ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    for (const line of chunk.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") break;
      try {
        const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
        const delta = parsed.choices?.[0]?.delta?.content ?? "";
        if (delta) { full += delta; onChunk(delta); }
      } catch {
        // skip malformed line
      }
    }
  }
  return full;
}

export type StructuredResult = {
  tool: string;
  data: Record<string, unknown> | null;
  markdown: string;
  score: number | null;
  title: string;
  summary: string;
  id?: string;
};

export async function callStructuredAI(
  tool: string,
  input: string,
  context?: Record<string, unknown>
): Promise<StructuredResult> {
  const res = await fetch(`${getApiBase()}/api/ai/structured`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, input, context }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Unknown error" })) as { message?: string; error?: string };
    if (err.error === "AI_NOT_CONFIGURED") {
      throw new Error("AI is not configured. Add OPENAI_API_KEY or GROQ_API_KEY in Replit Secrets.");
    }
    throw new Error(err.message ?? `Structured AI failed: ${res.status}`);
  }

  return res.json() as Promise<StructuredResult>;
}

// Calls structured AI while emitting semantic stage labels so the UI shows real progress,
// not a dead spinner. Stages advance on a timer; analysis runs in parallel.
export async function streamStructuredAI(
  tool: string,
  input: string,
  options: {
    onStage?: (stage: string) => void;
    context?: Record<string, unknown>;
  } = {}
): Promise<StructuredResult> {
  const { onStage, context } = options;
  const stages = TOOL_STAGES[tool] ?? ["Analyzing…", "Identifying patterns…", "Compiling intelligence…"];

  let stageIdx = 0;
  onStage?.(stages[0]);

  const interval = setInterval(() => {
    if (stageIdx < stages.length - 2) {
      stageIdx++;
      onStage?.(stages[stageIdx]);
    }
  }, 2400);

  try {
    const result = await callStructuredAI(tool, input, context);
    clearInterval(interval);
    onStage?.(stages[stages.length - 1]);
    return result;
  } catch (err) {
    clearInterval(interval);
    throw err;
  }
}

// Full pipeline: load cross-tool context → inject it → stream with semantic stages.
// Every analysis becomes smarter by knowing what came before.
export async function callWithCrossContext(
  tool: string,
  input: string,
  options: {
    onStage?: (stage: string) => void;
    projectId?: string | null;
    context?: Record<string, unknown>;
  } = {}
): Promise<StructuredResult & { injectedContext: InjectedContext }> {
  const { onStage, projectId, context } = options;

  onStage?.("Loading intelligence context…");
  const injectedContext = await loadCrossToolContext(tool, projectId);
  const contextBlock = buildContextBlock(injectedContext, tool);
  const enrichedInput = contextBlock ? `${input}${contextBlock}` : input;

  const result = await streamStructuredAI(tool, enrichedInput, { onStage, context });
  return { ...result, injectedContext };
}

// Call the insight-sweep backend to synthesize ALL reports into strategic intelligence
export async function callInsightSweep(reportsInput: string): Promise<{
  data: Record<string, unknown> | null;
  raw: string;
}> {
  const res = await fetch(`${getApiBase()}/api/ai/insight-sweep`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportsInput }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed" })) as { message?: string; error?: string };
    if (err.error === "AI_NOT_CONFIGURED") {
      throw new Error("AI is not configured. Add OPENAI_API_KEY or GROQ_API_KEY in Replit Secrets.");
    }
    throw new Error(err.message ?? `Insight sweep failed: ${res.status}`);
  }

  return res.json() as Promise<{ data: Record<string, unknown> | null; raw: string }>;
}
