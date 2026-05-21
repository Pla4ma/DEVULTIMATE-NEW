import { IGNORED_DIRS, IGNORED_EXTENSIONS, SECRET_PATTERNS, MAX_DIR_DEPTH } from "./constants";

export function redactSecrets(content: string): string {
  let result = content;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, "[REDACTED]");
  }
  return result;
}

export function isSafePath(filePath: string): boolean {
  if (filePath.includes("..")) return false;
  if (filePath.startsWith("/")) return false;
  if (filePath.includes("\0")) return false;
  const depth = filePath.split("/").length;
  if (depth > MAX_DIR_DEPTH) return false;
  return true;
}

export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

export function shouldIgnoreDir(pathParts: string[]): boolean {
  for (const part of pathParts) {
    if (IGNORED_DIRS.has(part)) return true;
  }
  return false;
}

export function isImageOrMedia(ext: string): boolean {
  return IGNORED_EXTENSIONS.has(ext);
}

export function isBinary(filename: string): boolean {
  return isImageOrMedia(getExtension(filename));
}

export function getEntryPriority(filePath: string): number {
  const parts = filePath.split("/");
  const name = parts[parts.length - 1]!;
  const lower = filePath.toLowerCase();
  const lowerName = name.toLowerCase();
  if (lowerName === "package.json") return 1;
  if (lowerName.startsWith("readme")) return 1;
  if (lowerName === ".gitignore" || lowerName.startsWith(".env")) return 1;
  if (lowerName === "dockerfile" || lowerName.includes("docker-compose")) return 1;
  if (lower.includes(".github/workflows") || lower.includes(".gitlab-ci")) return 1;
  if (lowerName === "tsconfig.json" || lowerName.startsWith("tsconfig.")) return 1;
  if (lowerName.startsWith("vite.config") || lowerName.startsWith("next.config") || lowerName.startsWith("nuxt.config") || lowerName.startsWith("remix.config")) return 1;
  if (["vercel.json", "netlify.toml", "fly.toml", "render.yaml", ".replit"].includes(lowerName)) return 1;
  if (lower.includes("/migrations/") || lower.includes("/migration/") || lowerName.includes("schema.sql")) return 1;
  if (lower.includes("/auth/") || lowerName.includes("auth")) return 1;
  if (lowerName.includes("stripe") || lowerName.includes("payment")) return 1;
  if (lower.includes("/api/") || lower.includes("/api-") || lowerName.includes("route") || lowerName.includes("handler")) return 1;
  if (lower.includes("/app/") || lower.includes("/pages/") || lower.includes("/routes/") || lower.includes("/views/") || lower.includes("/screens/")) return 1;
  if (lowerName.includes(".test.") || lowerName.includes(".spec.") || lower.includes("/__tests__/")) return 1;
  if (lowerName.includes("prisma") || lowerName.includes("drizzle") || lowerName.includes("supabase")) return 1;
  if (lowerName.includes("middleware")) return 1;
  if (lowerName.endsWith(".ts") || lowerName.endsWith(".tsx") || lowerName.endsWith(".js") || lowerName.endsWith(".jsx") || lowerName.endsWith(".mjs") || lowerName.endsWith(".cjs")) {
    if (lower.includes("/server/") || lower.includes("/services/") || lower.includes("/hooks/") || lower.includes("/lib/")) return 1;
  }
  if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".yaml", ".yml", ".toml"].some(e => lowerName.endsWith(e))) return 2;
  if (lowerName.endsWith(".css") || lowerName.endsWith(".scss") || lowerName.endsWith(".html")) return 2;
  return 3;
}
