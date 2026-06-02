import { logger } from "./logger";

export type AIProvider = "openai-compatible" | "openai" | "groq" | "lovable";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICallPayload {
  messages: AIMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" } | { type: "text" };
}

export interface AICallResult {
  content: string;
  providerUsed: AIProvider;
  modelUsed: string;
  fallbackUsed: boolean;
  attemptedProviders: AIProvider[];
  providerWarnings: string[];
}

export interface ProviderStatus {
  provider: AIProvider;
  configured: boolean;
  model: string | null;
}

function getOpenAICompatConfig() {
  const key = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const model = process.env.AI_INTEGRATIONS_OPENAI_MODEL || "gpt-4o-mini";
  if (!key || !baseUrl) return null;
  return { key, baseUrl, model };
}

function getOpenAIConfig() {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!key) return null;
  return { key, model };
}

function getGroqConfig() {
  const key = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const baseUrl = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
  if (!key) return null;
  return { key, model, baseUrl };
}

function getLovableConfig() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  const baseUrl = process.env.LOVABLE_BASE_URL || "https://api.lovable.app/v1";
  const model = process.env.LOVABLE_MODEL || "gpt-4o-mini";
  return { key, model, baseUrl };
}

export function getConfiguredProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  if (getOpenAICompatConfig()) providers.push("openai-compatible");
  if (getOpenAIConfig()) providers.push("openai");
  if (getGroqConfig()) providers.push("groq");
  if (getLovableConfig()) providers.push("lovable");
  return providers;
}

export function isAiConfigured(): boolean {
  return getConfiguredProviders().length > 0;
}

export function getProviderStatus(): ProviderStatus[] {
  const compat = getOpenAICompatConfig();
  const openai = getOpenAIConfig();
  const groq = getGroqConfig();
  const lovable = getLovableConfig();
  return [
    { provider: "openai-compatible", configured: !!compat, model: compat?.model ?? null },
    { provider: "openai", configured: !!openai, model: openai?.model ?? null },
    { provider: "groq", configured: !!groq, model: groq?.model ?? null },
    { provider: "lovable", configured: !!lovable, model: lovable?.model ?? null },
  ];
}

export function normalizeProviderError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("Invalid API")) {
      return "Authentication failed — check your API key";
    }
    if (msg.includes("429") || msg.includes("rate limit") || msg.includes("Rate limit")) {
      return "Rate limit exceeded";
    }
    if (msg.includes("timeout") || msg.includes("ECONNRESET") || msg.includes("ETIMEDOUT")) {
      return "Request timed out";
    }
    if (msg.includes("5") && msg.includes("server")) {
      return "Provider server error";
    }
    return msg.slice(0, 200);
  }
  return String(error).slice(0, 200);
}

async function callOpenAICompatible(payload: AICallPayload): Promise<string> {
  const cfg = getOpenAICompatConfig();
  if (!cfg) throw new Error("OpenAI-compatible not configured");
  return callOpenAIStyleEndpoint(cfg.baseUrl, cfg.key, cfg.model, payload);
}

async function callOpenAI(payload: AICallPayload): Promise<{ content: string; model: string }> {
  const cfg = getOpenAIConfig();
  if (!cfg) throw new Error("OpenAI not configured");
  const result = await callOpenAIStyleEndpoint("https://api.openai.com/v1", cfg.key, cfg.model, payload);
  return { content: result, model: cfg.model };
}

async function callGroq(payload: AICallPayload): Promise<{ content: string; model: string }> {
  const cfg = getGroqConfig();
  if (!cfg) throw new Error("Groq not configured");
  const result = await callOpenAIStyleEndpoint(cfg.baseUrl, cfg.key, cfg.model, payload);
  return { content: result, model: cfg.model };
}

async function callLovable(payload: AICallPayload): Promise<string> {
  const cfg = getLovableConfig();
  if (!cfg) throw new Error("Lovable not configured");
  return callOpenAIStyleEndpoint(cfg.baseUrl, cfg.key, cfg.model, payload);
}

async function callOpenAIStyleEndpoint(
  baseUrl: string,
  apiKey: string,
  model: string,
  payload: AICallPayload,
): Promise<string> {
  const messages: AIMessage[] = [];
  if (payload.systemPrompt) {
    messages.push({ role: "system", content: payload.systemPrompt });
  }
  messages.push(...payload.messages);

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: payload.temperature ?? 0.7,
    max_tokens: payload.maxTokens ?? 4096,
  };

  if (payload.responseFormat) {
    body.response_format = payload.responseFormat;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from AI provider");
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

export async function callAIWithFallback(payload: AICallPayload): Promise<AICallResult> {
  const providers = getConfiguredProviders();

  if (providers.length === 0) {
    throw new Error("AI is not configured. Add OPENAI_API_KEY or GROQ_API_KEY in Replit Secrets.");
  }

  const attemptedProviders: AIProvider[] = [];
  const providerWarnings: string[] = [];
  let firstProvider = true;

  for (const provider of providers) {
    attemptedProviders.push(provider);
    try {
      let content: string;
      let model = "unknown";

      if (provider === "openai-compatible") {
        const cfg = getOpenAICompatConfig()!;
        content = await callOpenAICompatible(payload);
        model = cfg.model;
      } else if (provider === "openai") {
        const result = await callOpenAI(payload);
        content = result.content;
        model = result.model;
      } else if (provider === "groq") {
        const result = await callGroq(payload);
        content = result.content;
        model = result.model;
      } else if (provider === "lovable") {
        const cfg = getLovableConfig()!;
        content = await callLovable(payload);
        model = cfg.model;
      } else {
        throw new Error(`Unknown provider: ${provider}`);
      }

      return {
        content,
        providerUsed: provider,
        modelUsed: model,
        fallbackUsed: !firstProvider,
        attemptedProviders,
        providerWarnings,
      };
    } catch (err) {
      const errMsg = normalizeProviderError(err);
      logger.warn({ provider, error: errMsg }, "AI provider failed, trying next");
      providerWarnings.push(`${provider}: ${errMsg}`);
      firstProvider = false;
    }
  }

  throw new Error(
    `All AI providers failed. Tried: ${attemptedProviders.join(", ")}. Errors: ${providerWarnings.join("; ")}`,
  );
}
