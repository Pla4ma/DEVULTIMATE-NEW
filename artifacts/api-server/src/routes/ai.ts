import { Router } from "express";
import { callAIWithFallback, isAiConfigured, getConfiguredProviders } from "../lib/ai-client";
import { safeParseAiJson, buildRepairPrompt } from "../lib/ai-json";
import { buildFallbackResult, getRequiredFields, validateReportQuality } from "../lib/report-quality";
import { requireQuota, requirePlan } from "../lib/usage-quota";
import { INSIGHT_SWEEP_PROMPT } from "../prompts";
import { getOpenAIStreamConfig, streamViaOpenAI, streamViaGroq } from "./ai-helpers/stream";
import { buildDoctorUserContent } from "./ai-helpers/doctor-prompt";
import { buildSystemPrompt } from "./ai-helpers/prompt-registry";
import { extractScore, extractTitle, extractSummary } from "./ai-helpers/extractors";

const router = Router();

const MAX_MESSAGES = 100;
const MAX_MESSAGE_LENGTH = 100000;
const MAX_INPUT_LENGTH = 50000;

function aiNotConfiguredResponse(res: import("express").Response): void {
  res.status(503).json({
    error: "AI_NOT_CONFIGURED",
    message: "AI is not configured. Add OPENAI_API_KEY or GROQ_API_KEY in Replit Secrets.",
  });
}

function aiErrorResponse(req: import("express").Request, res: import("express").Response, err: unknown): void {
  req.log.error({ err }, "AI error");
  res.status(500).json({
    error: "AI_ERROR",
    message: err instanceof Error ? err.message : "AI request failed",
  });
}

// POST /api/ai/chat
router.post("/chat", requireQuota("ai-chat", "aiCallsPerDay"), async (req, res) => {
  if (!isAiConfigured()) { aiNotConfiguredResponse(res); return; }

  const { messages = [], systemPrompt } = req.body as {
    messages: Array<{ role: string; content: string }>;
    systemPrompt?: string;
  };

  if (!Array.isArray(messages)) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: "messages must be an array" });
    return;
  }

  if (messages.length > MAX_MESSAGES) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: `Too many messages (max ${MAX_MESSAGES})` });
    return;
  }

  const validMessages = messages.filter(
    (m) => m.role === "user" || m.role === "assistant" || m.role === "system"
  ).map((m) => ({
    role: m.role as "system" | "user" | "assistant",
    content: m.content.slice(0, MAX_MESSAGE_LENGTH),
  }));

  try {
    const result = await callAIWithFallback({
      messages: validMessages, systemPrompt, temperature: 0.7, maxTokens: 4096,
    });
    res.json({ content: result.content, model: result.modelUsed, provider: result.providerUsed, fallbackUsed: result.fallbackUsed });
  } catch (err) { aiErrorResponse(req, res, err); }
});

// POST /api/ai/stream
router.post("/stream", requireQuota("ai-stream", "aiCallsPerDay"), requirePlan(["pro", "team", "enterprise", "admin"]), async (req, res) => {
  const providers = getConfiguredProviders();
  if (providers.length === 0) { aiNotConfiguredResponse(res); return; }

  const { messages = [], systemPrompt } = req.body as {
    messages: Array<{ role: string; content: string }>;
    systemPrompt?: string;
  };

  if (!Array.isArray(messages)) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: "messages must be an array" });
    return;
  }

  if (messages.length > MAX_MESSAGES) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: `Too many messages (max ${MAX_MESSAGES})` });
    return;
  }

  const fullMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  if (systemPrompt) fullMessages.push({ role: "system", content: systemPrompt.slice(0, MAX_MESSAGE_LENGTH) });
  fullMessages.push(
    ...messages.filter((m) => m.role === "user" || m.role === "assistant" || m.role === "system").map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content.slice(0, MAX_MESSAGE_LENGTH),
    }))
  );

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const openaiStreamed = await streamViaOpenAI(fullMessages, res);
  if (openaiStreamed) { res.end(); return; }
  if (getOpenAIStreamConfig()) req.log.warn("OpenAI stream failed, falling back to Groq stream");

  const groqStreamed = await streamViaGroq(fullMessages, res);
  if (groqStreamed) return;

  try {
    const result = await callAIWithFallback({ messages: fullMessages, temperature: 0.7, maxTokens: 4096 });
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
router.post("/structured", requireQuota("ai-structured", "structuredReportsPerDay"), async (req, res) => {
  if (!isAiConfigured()) { aiNotConfiguredResponse(res); return; }

  const { tool, input, context } = req.body as {
    tool: string; input: string; context?: Record<string, unknown>;
  };

  if (!tool?.trim() || !input?.trim()) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: "tool and input are required" });
    return;
  }

  if (input.length > MAX_INPUT_LENGTH) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: `Input too long (max ${MAX_INPUT_LENGTH} characters)` });
    return;
  }

  const systemPrompt = buildSystemPrompt(tool);
  let userContent = input;
  if (context && Object.keys(context).length > 0) {
    userContent = tool === "doctor" ? buildDoctorUserContent(input, context) : `${input}\n\n---\nFounder context:\n${JSON.stringify(context, null, 2)}`;
  }

  let raw = "";
  let providerMeta: {
    providerUsed: string; modelUsed: string; fallbackUsed: boolean;
    attemptedProviders: string[]; providerWarnings: string[];
  } | null = null;
  try {
    const result = await callAIWithFallback({
      messages: [{ role: "user", content: userContent }],
      systemPrompt, temperature: 0.6, maxTokens: 6000,
    });
    raw = result.content;
    providerMeta = {
      providerUsed: result.providerUsed, modelUsed: result.modelUsed,
      fallbackUsed: result.fallbackUsed, attemptedProviders: result.attemptedProviders,
      providerWarnings: result.providerWarnings,
    };
  } catch (err) { aiErrorResponse(req, res, err); return; }

  const normalizeData = (value: unknown): Record<string, unknown> | null =>
    value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

  let parseResult = safeParseAiJson<Record<string, unknown>>(raw);
  let data = normalizeData(parseResult.data);
  let repairAttempted = false;
  let quality = data ? validateReportQuality(tool, data, parseResult.repaired) : null;

  async function attemptRepair(reason: string) {
    repairAttempted = true;
    try {
      const repairPrompt = buildRepairPrompt(tool, raw, reason);
      const repairResult = await callAIWithFallback({ messages: [{ role: "user", content: repairPrompt }], temperature: 0.1, maxTokens: 4096 });
      parseResult = safeParseAiJson<Record<string, unknown>>(repairResult.content);
      data = normalizeData(parseResult.data);
      if (data) {
        quality = validateReportQuality(tool, data, parseResult.repaired || repairAttempted);
        req.log.info({ tool }, "JSON repair succeeded");
      } else { quality = null; }
      providerMeta = {
        providerUsed: repairResult.providerUsed, modelUsed: repairResult.modelUsed,
        fallbackUsed: repairResult.fallbackUsed, attemptedProviders: repairResult.attemptedProviders,
        providerWarnings: repairResult.providerWarnings,
      };
    } catch (repairErr) { req.log.error({ repairErr }, "JSON repair call failed"); }
  }

  if (!data && parseResult.error) {
    req.log.warn({ tool, error: parseResult.error }, "Initial JSON parse failed, attempting repair");
    await attemptRepair(parseResult.error);
  }

  if (data && quality && !quality.valid && !repairAttempted) {
    req.log.warn({ tool, missingFields: quality.missingFields }, "Structured output missing fields, attempting repair");
    await attemptRepair(`Missing required fields: ${quality.missingFields.join(", ")}`);
  }

  if (data && !quality) quality = validateReportQuality(tool, data, parseResult.repaired || repairAttempted);

  if (!data || (quality && !quality.valid)) {
    const missingFields = quality?.missingFields ?? getRequiredFields(tool);
    const warnings = [...(quality?.warnings ?? []), ...(parseResult.error && !data ? [parseResult.error] : [])];
    data = buildFallbackResult(tool);
    quality = {
      valid: false, repaired: parseResult.repaired || repairAttempted, missingFields,
      warnings: warnings.length > 0 ? warnings : ["AI response missing required fields — fallback returned"],
      contentWarnings: quality?.contentWarnings ?? [], qualityConfidence: "low", parseStatus: "fallback",
    };
  }

  res.json({
    tool, data, markdown: raw, score: extractScore(data, tool),
    title: extractTitle(data, tool, input), summary: extractSummary(data, raw),
    quality, providerMeta,
  });
});

// GET /api/ai/status
router.get("/status", (_req, res) => {
  const providers = getConfiguredProviders();
  res.json({ configured: providers.length > 0, providers });
});

// POST /api/ai/insight-sweep
router.post("/insight-sweep", requireQuota("ai-insight-sweep", "structuredReportsPerDay"), async (req, res) => {
  if (!isAiConfigured()) { aiNotConfiguredResponse(res); return; }

  const { reportsInput } = req.body as { reportsInput: string };
  if (!reportsInput?.trim()) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: "reportsInput is required" });
    return;
  }

  if (reportsInput.length > MAX_INPUT_LENGTH) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: `Input too long (max ${MAX_INPUT_LENGTH} characters)` });
    return;
  }

  let raw = "";
  try {
    const result = await callAIWithFallback({
      messages: [{ role: "user", content: reportsInput }],
      systemPrompt: INSIGHT_SWEEP_PROMPT, temperature: 0.4, maxTokens: 4000,
    });
    raw = result.content;
  } catch (err) { aiErrorResponse(req, res, err); return; }

  let parseResult = safeParseAiJson<Record<string, unknown>>(raw);

  if (!parseResult.data && parseResult.error) {
    req.log.warn({ error: parseResult.error }, "Insight sweep JSON parse failed, attempting repair");
    try {
      const repairResult = await callAIWithFallback({
        messages: [{ role: "user", content: buildRepairPrompt("insight-sweep", raw, parseResult.error) }],
        temperature: 0.1, maxTokens: 3000,
      });
      parseResult = safeParseAiJson<Record<string, unknown>>(repairResult.content);
    } catch (repairErr) { req.log.error({ repairErr }, "Insight sweep JSON repair failed"); }
  }

  res.json({ data: parseResult.data ?? null, raw });
});

export default router;
