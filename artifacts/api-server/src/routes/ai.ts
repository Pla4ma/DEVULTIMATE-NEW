import { Router } from "express";
import Groq from "groq-sdk";
import { callAIWithFallback, isAiConfigured, getConfiguredProviders } from "../lib/ai-client";
import { safeParseAiJson, buildRepairPrompt } from "../lib/ai-json";
import { buildFallbackResult, getRequiredFields, validateReportQuality } from "../lib/report-quality";

const router = Router();

function getGroq(): Groq | null {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  return new Groq({ apiKey: key });
}

function getOpenAIStreamConfig(): { key: string; baseUrl: string; model: string } | null {
  // Try Replit AI-integrations OpenAI-compatible first
  const compatKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const compatBase = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  if (compatKey && compatBase) {
    const model = process.env.AI_INTEGRATIONS_OPENAI_MODEL || "gpt-4o-mini";
    return { key: compatKey, baseUrl: compatBase, model };
  }
  // Fall back to direct OpenAI key
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  return { key, baseUrl: "https://api.openai.com/v1", model };
}

async function streamViaOpenAI(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  res: import("express").Response,
): Promise<boolean> {
  const cfg = getOpenAIStreamConfig();
  if (!cfg) return false;

  let response: Response;
  try {
    response = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.key}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      }),
    });
  } catch {
    return false;
  }

  if (!response.ok || !response.body) return false;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          res.write("data: [DONE]\n\n");
          return true;
        }
        try {
          const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
          }
        } catch { /* skip malformed lines */ }
      }
    }
    res.write("data: [DONE]\n\n");
    return true;
  } catch {
    return false;
  }
}

// mixtral-8x7b-32768 removed — deprecated by Groq as of 2025
const GROQ_MODEL_CHAIN = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
] as const;

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  if (!isAiConfigured()) {
    res.status(503).json({
      error: "AI_NOT_CONFIGURED",
      message: "AI is not configured. Add OPENAI_API_KEY or GROQ_API_KEY in Replit Secrets.",
    });
    return;
  }

  const { messages = [], systemPrompt } = req.body as {
    messages: Array<{ role: string; content: string }>;
    systemPrompt?: string;
  };

  const validMessages = messages.filter(
    (m) => m.role === "user" || m.role === "assistant" || m.role === "system"
  ) as Array<{ role: "system" | "user" | "assistant"; content: string }>;

  try {
    const result = await callAIWithFallback({
      messages: validMessages,
      systemPrompt,
      temperature: 0.7,
      maxTokens: 4096,
    });
    res.json({
      content: result.content,
      model: result.modelUsed,
      provider: result.providerUsed,
      fallbackUsed: result.fallbackUsed,
    });
  } catch (err) {
    req.log.error({ err }, "AI chat error");
    res.status(500).json({
      error: "AI_ERROR",
      message: err instanceof Error ? err.message : "AI request failed",
    });
  }
});

// POST /api/ai/stream — OpenAI SSE stream, fallback to Groq, then non-streaming
router.post("/stream", async (req, res) => {
  const providers = getConfiguredProviders();
  if (providers.length === 0) {
    res.status(503).json({
      error: "AI_NOT_CONFIGURED",
      message: "AI is not configured. Add OPENAI_API_KEY or GROQ_API_KEY in Replit Secrets.",
    });
    return;
  }

  const { messages = [], systemPrompt } = req.body as {
    messages: Array<{ role: string; content: string }>;
    systemPrompt?: string;
  };

  const fullMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  if (systemPrompt) fullMessages.push({ role: "system", content: systemPrompt });
  fullMessages.push(
    ...messages.filter(
      (m) => m.role === "user" || m.role === "assistant" || m.role === "system"
    ) as typeof fullMessages
  );

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // 1. Try OpenAI streaming first (primary)
  const openaiStreamed = await streamViaOpenAI(fullMessages, res);
  if (openaiStreamed) {
    res.end();
    return;
  }

  if (getOpenAIStreamConfig()) {
    req.log.warn("OpenAI stream failed, falling back to Groq stream");
  }

  // 2. Fall back to Groq streaming
  const groq = getGroq();
  if (groq && providers.includes("groq")) {
    let lastErr: unknown;
    for (const model of GROQ_MODEL_CHAIN) {
      try {
        const stream = await groq.chat.completions.create({
          model,
          messages: fullMessages,
          temperature: 0.7,
          max_tokens: 4096,
          stream: true,
        });
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: delta } }] })}\n\n`);
          }
        }
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      } catch (err) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("model") || msg.includes("not found") || msg.includes("deprecated")) continue;
        break;
      }
    }
    req.log.warn({ err: lastErr }, "Groq stream failed, falling back to non-streaming");
  }

  // 3. Last resort: non-streaming fallback
  try {
    const result = await callAIWithFallback({
      messages: fullMessages,
      temperature: 0.7,
      maxTokens: 4096,
    });
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: result.content } }] })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    req.log.error({ err }, "AI stream fallback error");
    res.write(`data: ${JSON.stringify({ error: "AI_ERROR" })}\n\n`);
    res.end();
  }
});

// POST /api/ai/structured
router.post("/structured", async (req, res) => {
  if (!isAiConfigured()) {
    res.status(503).json({
      error: "AI_NOT_CONFIGURED",
      message: "AI is not configured. Add OPENAI_API_KEY or GROQ_API_KEY in Replit Secrets.",
    });
    return;
  }

  const { tool, input, context } = req.body as {
    tool: string;
    input: string;
    context?: Record<string, unknown>;
  };

  if (!tool?.trim() || !input?.trim()) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: "tool and input are required" });
    return;
  }

  const systemPrompt = buildSystemPrompt(tool);

  // For doctor tool, inject scan context into the user message directly
  let userContent = input;
  if (context && Object.keys(context).length > 0) {
    if (tool === "doctor") {
      userContent = buildDoctorUserContent(input, context);
    } else {
      userContent = `${input}\n\n---\nFounder context:\n${JSON.stringify(context, null, 2)}`;
    }
  }

  let raw = "";
  let providerMeta: {
    providerUsed: string;
    modelUsed: string;
    fallbackUsed: boolean;
    attemptedProviders: string[];
    providerWarnings: string[];
  } | null = null;
  try {
    const result = await callAIWithFallback({
      messages: [{ role: "user", content: userContent }],
      systemPrompt,
      temperature: 0.6,
      maxTokens: 6000,
    });
    raw = result.content;
    providerMeta = {
      providerUsed: result.providerUsed,
      modelUsed: result.modelUsed,
      fallbackUsed: result.fallbackUsed,
      attemptedProviders: result.attemptedProviders,
      providerWarnings: result.providerWarnings,
    };
  } catch (err) {
    req.log.error({ err }, "AI structured error");
    res.status(500).json({
      error: "AI_ERROR",
      message: err instanceof Error ? err.message : "AI request failed",
    });
    return;
  }

  const normalizeData = (value: unknown): Record<string, unknown> | null =>
    value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

  // Parse JSON using the robust bracket-balanced extractor
  let parseResult = safeParseAiJson<Record<string, unknown>>(raw);
  let data = normalizeData(parseResult.data);
  let repairAttempted = false;
  let quality = data ? validateReportQuality(tool, data, parseResult.repaired) : null;

  const attemptRepair = async (reason: string) => {
    repairAttempted = true;
    try {
      const repairPrompt = buildRepairPrompt(tool, raw, reason);
      const repairResult = await callAIWithFallback({
        messages: [{ role: "user", content: repairPrompt }],
        temperature: 0.1,
        maxTokens: 4096,
      });
      parseResult = safeParseAiJson<Record<string, unknown>>(repairResult.content);
      data = normalizeData(parseResult.data);
      if (data) {
        quality = validateReportQuality(tool, data, parseResult.repaired || repairAttempted);
        req.log.info({ tool }, "JSON repair succeeded");
      } else {
        quality = null;
      }
      providerMeta = {
        providerUsed: repairResult.providerUsed,
        modelUsed: repairResult.modelUsed,
        fallbackUsed: repairResult.fallbackUsed,
        attemptedProviders: repairResult.attemptedProviders,
        providerWarnings: repairResult.providerWarnings,
      };
    } catch (repairErr) {
      req.log.error({ repairErr }, "JSON repair call failed");
    }
  };

  if (!data && parseResult.error) {
    req.log.warn({ tool, error: parseResult.error }, "Initial JSON parse failed, attempting repair");
    await attemptRepair(parseResult.error);
  }

  if (data && quality && !quality.valid && !repairAttempted) {
    req.log.warn({ tool, missingFields: quality.missingFields }, "Structured output missing fields, attempting repair");
    await attemptRepair(`Missing required fields: ${quality.missingFields.join(", ")}`);
  }

  if (data && !quality) {
    quality = validateReportQuality(tool, data, parseResult.repaired || repairAttempted);
  }

  if (!data || (quality && !quality.valid)) {
    const missingFields = quality?.missingFields ?? getRequiredFields(tool);
    const warnings = [
      ...(quality?.warnings ?? []),
      ...(parseResult.error && !data ? [parseResult.error] : []),
    ];
    data = buildFallbackResult(tool);
    quality = {
      valid: false,
      repaired: parseResult.repaired || repairAttempted,
      missingFields,
      warnings: warnings.length > 0 ? warnings : ["AI response missing required fields — fallback returned"],
    };
  }

  const markdown = raw;
  const score = extractScore(data, tool);
  const title = extractTitle(data, tool, input);
  const summary = extractSummary(data, raw);

  res.json({
    tool,
    data,
    markdown,
    score,
    title,
    summary,
    quality,
    providerMeta,
  });
});

// GET /api/ai/status
router.get("/status", (_req, res) => {
  const providers = getConfiguredProviders();
  res.json({
    configured: providers.length > 0,
    providers,
  });
});

// ─── Doctor context builder ──────────────────────────────────────────────────

function buildDoctorUserContent(userInput: string, context: Record<string, unknown>): string {
  const parts: string[] = [];
  if (userInput.trim()) parts.push(`Founder notes:\n${userInput}`);

  const scanData = context.scanData as Record<string, unknown> | undefined;
  if (scanData) {
    const sm = (scanData.summaryMarkdown ?? scanData.summary_markdown) as string | undefined;
    if (sm) parts.push(`Scan summary:\n${sm}`);

    const signals = scanData.staticSignals as Record<string, unknown> | undefined;
    if (signals) {
      parts.push(`Static signals:\n${JSON.stringify(signals, null, 2)}`);
    }

    const samples = scanData.sampleFiles as unknown[] | undefined;
    if (Array.isArray(samples) && samples.length > 0) {
      const sampleStr = samples.slice(0, 3).map((s) => {
        const sf = s as Record<string, unknown>;
        return `File: ${sf.path}\n${String(sf.preview ?? "").slice(0, 300)}`;
      }).join("\n\n---\n");
      parts.push(`Sample files:\n${sampleStr}`);
    }
  }

  const launchGates = context.launchGates as unknown[] | undefined;
  if (Array.isArray(launchGates) && launchGates.length > 0) {
    parts.push(`Static launch gate results:\n${JSON.stringify(launchGates, null, 2)}`);
  }

  return parts.join("\n\n=====\n\n");
}

// ─── System prompts ──────────────────────────────────────────────────────────

function buildSystemPrompt(tool: string): string {
  const prompts: Record<string, string> = {
    idea: IDEA_PROMPT,
    reality: REALITY_PROMPT,
    mvp: MVP_PROMPT,
    proof: PROOF_PROMPT,
    swarm: SWARM_PROMPT,
    doctor: DOCTOR_PROMPT,
    launch: LAUNCH_PROMPT,
    twin: TWIN_PROMPT,
  };
  return prompts[tool] ?? GENERIC_PROMPT;
}

const JSON_RULE = `
CRITICAL OUTPUT RULES:
- Return ONLY valid JSON. No prose before or after. No markdown fences. No explanation.
- Every string field must contain specific, actionable content — never generic filler.
- If you find yourself writing "interesting" or "promising" or "consider" — stop and be more specific.
- All arrays must have at least 1 item unless the situation genuinely has none.
`;

const IDEA_PROMPT = `You are Noctra's Signal Chamber — a senior product strategist who has evaluated 500+ startup ideas and watched most of them fail for predictable reasons.

Your job: give the founder the most honest, specific signal analysis they will ever receive. Vague feedback kills startups slowly. Be surgical.

SCORING RUBRIC (signal_score):
- 0-35: Fatal structural flaw — market doesn't exist, or founder is the wrong person, or timing is badly wrong
- 36-55: Real problem but weak differentiation, unclear ICP, or crowded market with no edge
- 56-70: Genuine opportunity, but key assumptions unvalidated and path to traction unclear
- 71-85: Strong signal — specific pain, clear ICP, defensible angle, credible path
- 86-100: Exceptional — contrarian insight, urgent need, founder has unfair advantage

${JSON_RULE}

Return this exact JSON:
{
  "verdict": "One sentence — your honest, direct judgment. Name the core issue or opportunity. Never hedge.",
  "summary": "2-3 sentences: (1) what the real signal is, (2) the single biggest risk, (3) the one thing that would change the assessment.",
  "signal_score": <integer 0-100 per rubric above>,
  "who_hurts_most": "Not 'users' or 'businesses'. Name: role, company size, specific trigger moment of pain.",
  "why_it_matters": "The concrete cost — time, money, reputation — when this problem isn't solved. Specific.",
  "sharpest_experiment": "The single fastest experiment to validate or kill this idea. Must be completable in <2 weeks, have a clear pass/fail criterion, and involve real people saying yes with evidence (not surveys).",
  "strengths": [
    "Specific strength — e.g. 'Founder has direct distribution via 5,000-person newsletter in the exact ICP'",
    "Second specific strength"
  ],
  "red_flags": [
    "Specific red flag — e.g. 'Market is feature of Notion/Linear, not a standalone product'",
    "Second specific red flag"
  ],
  "assumptions": [
    {
      "assumption": "The specific belief being taken as true without evidence",
      "test": "Exactly how to test this in 1-2 weeks — what you do, who you talk to, what a YES looks like",
      "risk": "high|medium|low"
    }
  ],
  "better_versions": [
    {
      "name": "A sharper product name or framing",
      "positioning": "Complete positioning statement: For [who] who [problem], [product] is a [category] that [unique benefit]. Unlike [alternative], [differentiator].",
      "target_user": "Exact ICP — role, context, company type, trigger"
    }
  ],
  "next_actions": [
    "Specific action — who does what, by when, and what success looks like",
    "Second specific action",
    "Third specific action"
  ]
}`;

const REALITY_PROMPT = `You are Noctra's Reality Compiler — a startup assumption compiler that catches fatal errors before they become expensive mistakes. You think like a static analyzer: precise, brutal, and code-like.

The input may begin with [COMPILE MODE: <mode>] which scopes your analysis:
- idea: Full idea validity — market, timing, founder-fit, differentiation
- mvp: MVP scope reality — is this shippable, correctly scoped, and timed right?
- retention: Retention loop — why will users come back? What kills stickiness?
- monetization: Revenue reality — will anyone pay? Is pricing defensible?
- ai-wrapper: AI wrapper vulnerability — ChatGPT replacement risk and moat analysis
- launch: Launch reality — distribution channels and Day-1 traction thesis
- full: All of the above — full-spectrum compilation
If no mode is specified, default to "full".

COMPILE STATUS rules:
- PASSED: score >= 70 AND no errors with blocks_build: true
- WARNING: score 45-69 OR any high-severity errors present (not blocking)
- FAILED: score < 45 OR any error has blocks_build: true

SCORING RUBRIC (score):
- 0-35: Critical failure — core assumption provably wrong, must stop and pivot
- 36-55: Severe errors — multiple unvalidated critical assumptions, high failure risk
- 56-70: Warnings only — identifiable issues with clear fix paths
- 71-85: Mostly passing — risks understood and manageable
- 86-100: Clean compile — evidence-backed, moat exists, distribution clear

ERROR CODES (use the most specific matching code):
- TargetUserUndefinedError: No specific customer segment defined
- RetentionLoopMissingError: No mechanism to bring users back
- PaidValueWeakError: Value prop doesn't justify the price point
- DistributionChannelMissingError: No credible Day 1 acquisition channel
- ChatGPTReplacementRiskHighError: Core feature directly replaceable by ChatGPT
- ScopeCreepError: MVP scope is too large to ship in the stated timeline
- WeakMoatError: No durable competitive advantage identified
- NoProofError: Zero validation evidence — pure unverified hypothesis

GO_SIGNAL criteria (backward compat):
- GO: score >= 65 AND no blocking errors
- NO-GO: score < 40 OR any error with blocks_build: true
- CAUTION: everything else

${JSON_RULE}

Return this exact JSON:
{
  "title": "Concise label — e.g. 'Reality Compile: B2B Inventory SaaS'",
  "verdict": "One sentence — the most important truth the founder needs to hear right now.",
  "summary": "2-3 sentences: (1) the core reality, (2) the most dangerous assumption, (3) the survival path.",
  "compile_status": "PASSED|WARNING|FAILED",
  "score": <integer 0-100 per rubric>,
  "reality_score": <same integer — backward compat field>,
  "go_signal": "GO|CAUTION|NO-GO",
  "errors": [
    {
      "code": "TargetUserUndefinedError",
      "severity": "critical|high|medium|low",
      "message": "Short compiler-style error message — one line, specific",
      "why_it_matters": "Specific consequence if this error is not resolved",
      "fix": "Concrete, actionable fix with realistic timeline",
      "blocks_build": true
    }
  ],
  "warnings": [
    "Warning: specific issue that will not block but will materially hurt growth or retention"
  ],
  "product_patch": "A specific rewrite or pivot of the product concept that directly addresses the blocking errors. Be concrete — mention what changes, what gets cut, what gets added.",
  "patched_idea": "The full revised idea statement with all identified errors addressed — written as if it were the original pitch, ready to re-compile",
  "decisive_move": "The single highest-leverage action to take in the next 7 days to change the compile status",
  "blind_spots": [
    "A specific assumption the founder is not seeing — explain WHY it is a blind spot"
  ],
  "red_flags": [
    "Critical issue that could block launch or traction"
  ],
  "risk_items": [
    {
      "assumption": "The specific belief being stress-tested",
      "severity": "critical|high|medium|low",
      "mitigation": "Specific fix action with timeline"
    }
  ],
  "next_actions": [
    "Specific action to address the most critical error — with timeline and success criterion",
    "Second specific action"
  ]
}`;

const MVP_PROMPT = `You are Noctra's Blueprint Board — an experienced technical founder who has shipped 25+ MVPs, many in <6 weeks. You know that scope is the #1 killer of MVPs and ruthless prioritization is the only path.

Your job: compress the idea to the absolute minimum that delivers real value, prove it's buildable in the stated timeline, and give a week-by-week plan that a team can execute without interpretation.

SCORING RUBRIC (mvp_score):
- 0-40: Scope is too large for stated timeline, architecture decisions are wrong, or north star metric undefined
- 41-60: Viable scope but missing key elements (auth, data persistence, deployment) or timeline is optimistic
- 61-75: Solid plan but some cut decisions are debatable or architecture has unnecessary complexity
- 76-90: Well-scoped, credible timeline, right trade-offs
- 91-100: Exceptional — laser-focused scope, validated architecture, week 1 has working software

${JSON_RULE}

Return this exact JSON:
{
  "verdict": "One sentence on whether this scope is achievable and what the critical path decision is.",
  "summary": "2-3 sentences: (1) what the MVP actually is, (2) the biggest scope risk, (3) the one non-negotiable feature.",
  "mvp_score": <integer 0-100 per rubric>,
  "north_star_metric": "The single metric that proves this MVP is working — must be measurable, user-behavior-based (not vanity)",
  "ruthless_scope": {
    "build_now": ["Feature that is truly required for the core loop — no nice-to-haves", "Second essential feature"],
    "build_next": ["Feature to add in V2 after validation", "Second next feature"],
    "cut": ["Feature that seems necessary but isn't — explain why in the feature itself: 'CSV export — users can copy-paste for now'"]
  },
  "architecture": {
    "frontend": "Specific stack with reasoning — e.g. 'Next.js App Router — faster than CRA for the auth + dashboard pattern'",
    "backend": "Specific stack — or 'Serverless functions on Vercel — no infra to manage for MVP scale'",
    "database": "Specific choice — e.g. 'Supabase PostgreSQL — gives auth + DB + RLS in one'",
    "auth": "Specific choice — e.g. 'Supabase Auth — email/password only in MVP, social later'",
    "hosting": "Specific choice with reasoning"
  },
  "weeks": [
    {
      "week": "Week 1",
      "goal": "The specific deliverable — e.g. 'User can sign up and see empty dashboard with 1 working action'",
      "tasks": [
        "Specific task that can be completed in <4 hours",
        "Second specific task"
      ]
    }
  ],
  "milestones": [
    {
      "name": "Specific milestone name",
      "week": <week number as integer>,
      "criteria": "Specific, measurable criterion — e.g. '3 test users complete full onboarding without help'"
    }
  ],
  "feature_roi": [
    {
      "feature": "Feature name",
      "user_value": <1-10 — how much users care>,
      "build_effort": <1-10 — how hard to build>,
      "score": <user_value / build_effort * 10, rounded to integer>,
      "decision": "BUILD|CUT|DELAY",
      "reason": "One sentence — specific reasoning"
    }
  ],
  "next_actions": [
    "First thing to do to start building — specific and immediate",
    "Second action"
  ]
}`;

const PROOF_PROMPT = `You are Noctra's Proof Reactor — an evidence-based product researcher who has run 300+ validation experiments. You know the difference between real signal and founders fooling themselves.

Your job: assess the quality and density of proof collected, identify dangerous evidence gaps, and prescribe the next experiments that will actually move the needle.

SIGNAL DENSITY scoring:
- 0-20: No real evidence — user said "sounds cool" or founders haven't talked to anyone
- 21-40: Weak evidence — small sample, self-selected, or evidence doesn't show willingness to pay
- 41-60: Moderate evidence — some interviews with pain confirmation, no payment signal yet
- 61-75: Good evidence — multiple sources, some indication of urgency or payment intent
- 76-90: Strong evidence — paid pilots, LOIs, or repeated unprompted behavior
- 91-100: Exceptional — revenue, clear retention, or multiple paid customers

PROOF SCORE = overall confidence level, accounting for evidence quality, gaps, and risk

${JSON_RULE}

Return this exact JSON:
{
  "verdict": "One sentence on whether the current evidence justifies continued building or needs more validation first.",
  "summary": "2-3 sentences: (1) what the evidence actually shows, (2) the biggest gap, (3) the next unlock.",
  "proof_score": <integer 0-100>,
  "signal_density": <integer 0-100 per rubric above>,
  "experiments": [
    {
      "title": "Experiment name — specific",
      "method": "Exactly how to run it — who, what, how many, what you say or show",
      "success_signal": "Specific, measurable outcome that would mean 'yes this works' — not 'positive response'",
      "failure_signal": "What outcome means this assumption is wrong",
      "effort": "low|medium|high",
      "time_to_result": "e.g. '3 days', '2 weeks'",
      "status": "planned|running|complete"
    }
  ],
  "objections": [
    {
      "objection": "The specific objection heard or anticipated",
      "rebuttal": "The evidence-based response — not wishful thinking",
      "severity": "high|medium|low",
      "addressed": true
    }
  ],
  "evidence_gaps": [
    "Specific gap — e.g. 'No evidence that users will switch from current solution once they have sunk-cost habits'"
  ],
  "next_experiments": [
    "The single most important experiment to run next — specific, runnable, with a clear pass/fail"
  ],
  "next_actions": [
    "Specific action to collect the most important missing evidence",
    "Second specific action"
  ]
}`;

const SWARM_PROMPT = `You are Noctra's Swarm Field — a market research expert who simulates realistic persona reactions with surgical precision. You have studied thousands of B2B and B2C buying decisions.

Your job: generate a realistic swarm of personas that represent the actual market, not an idealized version. Each persona must have a distinct voice, real objections, and honest willingness-to-pay signals.

IMPORTANT:
- The context will specify a persona count and market segment — use exactly that count and target segment
- Personas must differ meaningfully — different roles, objections, budgets
- Do NOT make all personas enthusiastic — real markets have skeptics and non-buyers
- Price signals must be grounded in real B2B/B2C benchmarks for this category

SWARM SCORE scoring:
- 0-35: Market rejects the offer — majority would not try for free, strong objections dominate
- 36-55: Mixed signal — enthusiast minority but major friction for majority
- 56-70: Viable market — majority would try, some willing to pay, clear segment emerges
- 71-85: Strong signal — majority willing to pay, objections are manageable
- 86-100: Exceptional — strong willingness to pay, low friction, clear viral or referral potential

${JSON_RULE}

Return this exact JSON:
{
  "verdict": "One sentence on what the swarm reveals about market fit and pricing.",
  "summary": "2-3 sentences: (1) what segment is most receptive, (2) the dominant objection, (3) what would unlock the skeptics.",
  "swarm_score": <integer 0-100 per rubric>,
  "consensus": "The one thing the majority of the swarm agrees on — could be positive or negative",
  "pricing_signal": "Specific price range with reasoning — e.g. '$29-49/mo for SMB, $149+ for teams, based on [comparable tools]'",
  "segment_breakdown": {
    "enthusiasts": <integer 0-100 — percentage who would actively champion this>,
    "skeptics": <integer 0-100 — percentage with strong objections>,
    "neutrals": <integer 0-100 — percentage on the fence>
  },
  "personas": [
    {
      "name": "Full name — make it realistic",
      "role": "Specific job title",
      "company": "Company type and size — e.g. 'Series A SaaS, 45 employees'",
      "segment": "enthusiast|skeptic|neutral",
      "reaction": "Their honest first reaction in their own voice — 2-3 sentences",
      "top_objection": "Their single strongest objection — specific",
      "willingness_to_pay": "Their specific WTP — e.g. '$0 — would use free tier only' or '$49/mo if it replaces [tool]'",
      "would_buy": true
    }
  ],
  "top_objections": [
    {
      "objection": "The specific objection",
      "frequency": "high|medium|low",
      "blocking": true,
      "rebuttal": "The most credible response — evidence-based",
      "killer_question": "The question that would surface whether this objection is real or a proxy for something else"
    }
  ],
  "recommendations": [
    "Specific recommendation based on swarm findings — not generic advice"
  ],
  "next_experiments": [
    "Specific experiment to validate the most important finding from this swarm"
  ],
  "next_actions": [
    "Specific immediate action based on swarm results",
    "Second specific action"
  ]
}`;

const DOCTOR_PROMPT = `You are Noctra's Diagnostic Bay — a senior SRE and tech lead who has reviewed 100+ production codebases and launched 50+ products. You diagnose code health with the precision of a security auditor and the practicality of a founder.

Your job: analyze the provided scan data and code signals to deliver an honest assessment of launch readiness. Reference specific files, counts, and patterns from the scan data when available.

HEALTH SCORE scoring:
- 0-35: Not launchable — critical security issues, no deployment config, or broken build
- 36-55: Significant work needed — multiple HIGH issues, no tests, major security gaps
- 56-70: Launchable with caveats — known issues documented, monitoring in place or planned
- 71-85: Launch-ready — acceptable debt, issues tracked, critical paths covered
- 86-100: Production-grade — strong security posture, tested, monitored, documented

GATE STATUS:
- GREEN: No action required for launch
- YELLOW: Should fix soon but won't block launch
- RED: Must fix before launch

${JSON_RULE}

Return this exact JSON:
{
  "verdict": "One sentence — is this launchable, and what is the single most important fix needed?",
  "summary": "2-3 sentences: (1) overall health assessment referencing specific signals, (2) most critical issue, (3) what the founder should do in the next 48 hours.",
  "health_score": <integer 0-100 per rubric>,
  "framework": "Detected framework from scan data — e.g. 'Next.js 14 + TypeScript' or 'Unknown'",
  "gates": [
    {
      "name": "Gate name — e.g. 'Security Gate'",
      "status": "GREEN|YELLOW|RED",
      "evidence": ["Specific finding from scan — reference file names or counts", "Second finding"],
      "how_to_fix": "Specific, actionable fix — not 'improve security'"
    }
  ],
  "issues": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "issue": "Specific issue — reference the actual signal or file",
      "impact": "What breaks or goes wrong in production",
      "fix": "Specific fix with concrete steps",
      "effort_hours": <estimated hours as integer>
    }
  ],
  "repair_queue": [
    "Most impactful fix — one sentence, specific",
    "Second most impactful fix"
  ],
  "fix_plan": [
    {
      "title": "Fix title",
      "priority": "high|medium|low",
      "effort_hours": <integer>,
      "code_hint": "Optional: specific code change or command to run"
    }
  ],
  "critical_issues": [
    "Critical issue that MUST be fixed before launch"
  ],
  "next_actions": [
    "Specific next action — with estimated time to complete",
    "Second specific action"
  ]
}`;

const LAUNCH_PROMPT = `You are Noctra's Launch Control — an experienced growth lead and product launcher who has shipped 30+ products to market. You know that most launches fail not from bad products but from bad preparation.

Your job: give an honest readiness assessment and a specific action plan for the next 72 hours. Be direct about what's missing — a failed launch is worse than a delayed one.

LAUNCH SCORE scoring:
- 0-35: Not ready — missing critical launch requirements (no way to pay, broken onboarding, no distribution)
- 36-55: Significant gaps — product works but distribution plan is vague or error monitoring missing
- 56-70: Mostly ready — minor issues that could be shipped with caveats
- 71-85: Launch-ready — all critical gates passed, distribution plan credible
- 86-100: Exceptional — pre-launch demand built, distribution locked, war-games done

GO/NO-GO criteria:
- GO: score >= 65 AND no RED gates AND distribution plan exists AND error monitoring in place
- NO-GO: score < 40 OR 2+ RED gates OR no onboarding flow
- HOLD: everything else — specify what to fix first

${JSON_RULE}

Return this exact JSON:
{
  "verdict": "One sentence — go, hold, or no-go, and the single most important reason.",
  "summary": "2-3 sentences: (1) overall readiness, (2) the biggest gap, (3) what would move this to GO.",
  "launch_score": <integer 0-100 per rubric>,
  "go_no_go": "GO|HOLD|NO-GO",
  "gates": [
    {
      "name": "Gate name — e.g. 'Distribution Gate'",
      "status": "GREEN|YELLOW|RED",
      "evidence": "Specific evidence from the input — what exists or is missing",
      "how_to_fix": "Specific fix — not 'improve distribution'"
    }
  ],
  "risks": [
    {
      "risk": "Specific launch risk",
      "probability": "high|medium|low",
      "impact": "high|medium|low",
      "mitigation": "Specific mitigation action"
    }
  ],
  "launch_checklist": [
    {
      "item": "Specific checklist item — e.g. 'Stripe checkout tested end-to-end with real card'",
      "category": "product|distribution|operations|legal|marketing",
      "done": false,
      "critical": true
    }
  ],
  "day_one_actions": [
    "Specific action for Day 1 of launch — with expected outcome"
  ],
  "distribution_plan": "The specific distribution strategy with channels, expected reach, and first 100 users path",
  "next_actions": [
    "The single most important thing to do right now before launch",
    "Second specific pre-launch action"
  ]
}`;

const TWIN_PROMPT = `You are Noctra's Memory Constellation — the founder's strategic advisor with perfect memory of their entire journey. You have access to all their reports, tasks, proof signals, and scores.

Your job: synthesize the memory context into an honest strategic assessment. Reference specific data points from the context. Surface contradictions, drift, and the moves that will actually move the needle.

OVERALL TRAJECTORY:
- "improving": scores trending up, tasks being completed, proof accumulating
- "stagnant": same issues appearing across reports, tasks not moving, no new proof
- "declining": scores trending down, growing backlog, contradictions multiplying

${JSON_RULE}

Return this exact JSON:
{
  "summary": "2-3 sentences synthesizing the founder's actual strategic position — reference specific scores, reports, or tasks from the context",
  "overall_trajectory": "improving|stagnant|declining",
  "patterns": [
    {
      "pattern": "A specific pattern observed across the data — e.g. 'Proof score has been below 40 across 3 reports'",
      "evidence": "The specific data points that show this — reference report names, scores, tasks",
      "implication": "What this means for the founder's trajectory"
    }
  ],
  "contradictions": [
    {
      "contradiction": "A specific contradiction in the data — e.g. 'Signal Chamber scored 78 but Reality check gave NO-GO'",
      "resolution": "The specific way to resolve this contradiction"
    }
  ],
  "drift_signals": [
    {
      "signal": "A specific drift signal — e.g. 'MVP scope has expanded 3x from original blueprint'",
      "severity": "high|medium|low"
    }
  ],
  "strategic_moves": [
    "The single most impactful move based on all the data — specific and actionable",
    "Second strategic move",
    "Third strategic move"
  ],
  "next_actions": [
    "Specific next action derived from the synthesis",
    "Second specific next action"
  ]
}`;

const GENERIC_PROMPT = `You are Noctra AI — a founder intelligence assistant. Be direct, specific, and actionable. No generic advice.

Return valid JSON with your analysis. Include "summary", "verdict", "score" (0-100), and "next_actions" (array of strings) at minimum.`;

// ─── Extraction helpers ──────────────────────────────────────────────────────

function extractScore(data: Record<string, unknown> | null, tool: string): number | null {
  if (!data) return null;
  const scoreKeys = [
    `${tool}_score`,
    "signal_score",
    "health_score",
    "proof_score",
    "mvp_score",
    "swarm_score",
    "launch_score",
    "reality_score",
    "readiness_score",
    "score",
  ];
  for (const key of scoreKeys) {
    const val = data[key];
    if (typeof val === "number" && !isNaN(val)) {
      return Math.min(100, Math.max(0, Math.round(val)));
    }
  }
  return null;
}

function extractTitle(data: Record<string, unknown> | null, tool: string, input: string): string {
  if (data?.title && typeof data.title === "string" && data.title.trim()) {
    return data.title.trim();
  }
  // Generate a title from the verdict or first line of input
  if (data?.verdict && typeof data.verdict === "string") {
    const v = data.verdict.trim();
    if (v.length <= 80) return v;
  }
  const toolLabels: Record<string, string> = {
    idea: "Signal Chamber",
    reality: "Pressure Matrix",
    mvp: "Blueprint Board",
    proof: "Proof Reactor",
    swarm: "Swarm Field",
    doctor: "Diagnostic Bay",
    launch: "Launch Control",
    twin: "Memory Constellation",
  };
  const label = toolLabels[tool] ?? tool;
  const inputSnippet = input.split("\n")[0].slice(0, 60);
  return `${label} — ${inputSnippet}${input.length > 60 ? "…" : ""}`;
}

function extractSummary(data: Record<string, unknown> | null, raw: string): string {
  if (data?.summary && typeof data.summary === "string" && data.summary.trim()) {
    return data.summary.trim().slice(0, 500);
  }
  if (data?.verdict && typeof data.verdict === "string" && data.verdict.trim()) {
    return data.verdict.trim().slice(0, 500);
  }
  // Fall back to first 200 chars of raw (after any JSON block)
  const afterJson = raw.slice(raw.lastIndexOf("}") + 1).trim();
  if (afterJson.length > 20) return afterJson.slice(0, 200);
  return raw.slice(0, 200);
}

// POST /api/ai/insight-sweep — synthesize ALL reports into cross-cutting strategic intelligence
router.post("/insight-sweep", async (req, res) => {
  if (!isAiConfigured()) {
    res.status(503).json({
      error: "AI_NOT_CONFIGURED",
      message: "AI is not configured. Add OPENAI_API_KEY or GROQ_API_KEY in Replit Secrets.",
    });
    return;
  }

  const { reportsInput } = req.body as { reportsInput: string };

  if (!reportsInput?.trim()) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: "reportsInput is required" });
    return;
  }

  let raw = "";
  try {
    const result = await callAIWithFallback({
      messages: [{ role: "user", content: reportsInput }],
      systemPrompt: INSIGHT_SWEEP_PROMPT,
      temperature: 0.4,
      maxTokens: 4000,
    });
    raw = result.content;
  } catch (err) {
    req.log.error({ err }, "Insight sweep AI error");
    res.status(500).json({ error: "AI_ERROR", message: err instanceof Error ? err.message : "AI request failed" });
    return;
  }

  let parseResult = safeParseAiJson<Record<string, unknown>>(raw);

  if (!parseResult.data && parseResult.error) {
    req.log.warn({ error: parseResult.error }, "Insight sweep JSON parse failed, attempting repair");
    try {
      const repairResult = await callAIWithFallback({
        messages: [{ role: "user", content: buildRepairPrompt("insight-sweep", raw, parseResult.error) }],
        temperature: 0.1,
        maxTokens: 3000,
      });
      parseResult = safeParseAiJson<Record<string, unknown>>(repairResult.content);
    } catch (repairErr) {
      req.log.error({ repairErr }, "Insight sweep JSON repair failed");
    }
  }

  res.json({ data: parseResult.data ?? null, raw });
});

// ─── Insight sweep prompt ─────────────────────────────────────────────────────

const INSIGHT_SWEEP_PROMPT = `You are Noctra's Strategic Intelligence Engine — an elite founder advisor reviewing a complete corpus of product intelligence reports. Your job is to find what the founder CANNOT see by analyzing each tool in isolation.

RULES:
- Reference specific tools, scores, and findings. Never give generic advice.
- Contradictions must be LOGICAL contradictions between two specific data points from different tools.
- Every "next_priority" must be specific enough that the founder knows exactly what to do today.
- If trajectory is improving, say so with evidence. If declining, name the specific signals.
- Be direct: founders who see the real picture build better companies.

${JSON_RULE}

Return this exact JSON:
{
  "headline": "One sentence — the most important thing to know about this founder's strategic position right now",
  "trajectory": "improving|stagnant|declining",
  "analysis": "3-4 sentences analyzing the complete corpus — what trends, gaps, and patterns does the data show collectively that individual tools don't surface?",
  "contradictions": [
    {
      "description": "The specific logical contradiction — reference tool names and scores (e.g. 'Signal Chamber scored 78 but Pressure Matrix returned NO-GO')",
      "severity": "high|medium|low",
      "resolution": "Specific action to resolve this contradiction"
    }
  ],
  "patterns": [
    {
      "pattern": "A recurring pattern across multiple reports — reference specific tools and scores",
      "implication": "What this pattern means for the founder's trajectory"
    }
  ],
  "biggest_risk": "The single highest-risk item across all reports — specific, referencing the data",
  "biggest_opportunity": "The single highest-opportunity item — specific, referencing the data",
  "next_priorities": [
    "Most impactful specific action based on all data — concrete enough to start today",
    "Second priority — equally specific",
    "Third priority — equally specific"
  ]
}`;

export default router;
