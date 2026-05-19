export function normalizePriority(value: unknown): "high" | "medium" | "low" {
  const v = String(value ?? "medium").toLowerCase();
  if (v === "high" || v === "critical" || v === "urgent") return "high";
  if (v === "low" || v === "minor") return "low";
  return "medium";
}

export const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
export const asObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
export const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v.trim() : v == null ? fallback : String(v).trim();

export function truncate(s: string, max = 100): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
