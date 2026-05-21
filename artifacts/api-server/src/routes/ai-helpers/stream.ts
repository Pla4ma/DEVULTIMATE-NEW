import Groq from "groq-sdk";
import { getConfiguredProviders } from "../../lib/ai-client";

export function getGroq(): Groq | null {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  return new Groq({ apiKey: key });
}

export function getOpenAIStreamConfig(): { key: string; baseUrl: string; model: string } | null {
  const compatKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const compatBase = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  if (compatKey && compatBase) {
    const model = process.env.AI_INTEGRATIONS_OPENAI_MODEL || "gpt-4o-mini";
    return { key: compatKey, baseUrl: compatBase, model };
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  return { key, baseUrl: "https://api.openai.com/v1", model };
}

export const GROQ_MODEL_CHAIN = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
] as const;

export async function streamViaOpenAI(
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
        } catch { /* skip */ }
      }
    }
    res.write("data: [DONE]\n\n");
    return true;
  } catch {
    return false;
  }
}

export async function streamViaGroq(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  res: import("express").Response,
): Promise<boolean> {
  const groq = getGroq();
  if (!groq) return false;
  const providers = getConfiguredProviders();
  if (!providers.includes("groq")) return false;

  for (const model of GROQ_MODEL_CHAIN) {
    try {
      const stream = await groq.chat.completions.create({
        model,
        messages,
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
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("model") || msg.includes("not found") || msg.includes("deprecated")) continue;
      break;
    }
  }
  return false;
}
