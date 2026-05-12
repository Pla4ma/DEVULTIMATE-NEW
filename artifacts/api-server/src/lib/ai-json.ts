export function safeParseAiJson<T = unknown>(raw: string): { data: T | null; repaired: boolean; error?: string } {
  if (!raw || typeof raw !== "string") {
    return { data: null, repaired: false, error: "Empty response" };
  }

  let text = raw.trim();

  // Strip ```json ... ``` fences
  text = text.replace(/^```json\s*/i, "").replace(/\s*```\s*$/, "");
  // Strip plain ``` fences
  text = text.replace(/^```\s*/, "").replace(/\s*```\s*$/, "");

  text = text.trim();

  // Try direct parse first
  try {
    const parsed = JSON.parse(text) as T;
    return { data: parsed, repaired: false };
  } catch {
    // Continue to repair
  }

  // Find first JSON object
  const objStart = text.indexOf("{");
  const arrStart = text.indexOf("[");

  let jsonStr: string | null = null;

  if (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) {
    jsonStr = extractBracketedJson(text, objStart, "{", "}");
  } else if (arrStart !== -1) {
    jsonStr = extractBracketedJson(text, arrStart, "[", "]");
  }

  if (!jsonStr) {
    return { data: null, repaired: false, error: "No JSON structure found" };
  }

  // Try parse the extracted JSON
  try {
    const parsed = JSON.parse(jsonStr) as T;
    return { data: parsed, repaired: true };
  } catch {
    // Try repair: remove trailing commas
    const repaired = jsonStr
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/([{,])\s*,/g, "$1");

    try {
      const parsed = JSON.parse(repaired) as T;
      return { data: parsed, repaired: true };
    } catch (err) {
      return { data: null, repaired: false, error: `JSON parse failed: ${String(err).slice(0, 100)}` };
    }
  }
}

function extractBracketedJson(text: string, start: number, open: string, close: string): string | null {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === "\\") {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

export function buildJsonSystemPrompt(tool: string, schema: string): string {
  return `You are an expert product analyst running the "${tool}" analysis tool.
Return ONLY valid JSON matching this schema. No prose, no markdown, no extra text.

Schema:
${schema}`;
}

export function buildRepairPrompt(tool: string, original: string, parseError: string): string {
  return `The previous response for tool "${tool}" was invalid or missing required fields.
Reason: ${parseError}

Original response (first 2000 chars):
${original.slice(0, 2000)}

Return ONLY the corrected, valid JSON. No explanation.`;
}
