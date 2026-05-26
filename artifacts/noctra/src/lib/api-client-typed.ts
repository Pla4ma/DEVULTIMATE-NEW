import { authenticatedFetch } from "./api-client";

type ApiResult<T> = Promise<T>;

interface ScanResponse {
  scan: {
    fileCount: number;
    framework: string;
    packageManager: string;
    totalLines: number;
    totalSize: number;
    languages: Record<string, number>;
    evidenceIndex: Array<{ filePath: string; lineNumber?: number; snippet?: string; severity: string; explanation: string; signal: string }>;
    repoMap: Record<string, string[]>;
  };
  summaryMarkdown: string;
  launchGates: Array<{ name: string; status: "GREEN" | "YELLOW" | "RED"; evidence?: string[]; how_to_fix?: string; why?: string }>;
  evidenceIndex: Array<{ filePath: string; lineNumber?: number; snippet?: string; severity: string; explanation: string; signal: string }>;
  repoMap: Record<string, string[]>;
  warnings: string[];
  trimmed: boolean;
}

interface AIStructuredResponse {
  title: string;
  summary: string;
  score: number;
  markdown: string;
  data: unknown;
}

interface UsageResponse {
  scansUsed: number;
  scansLimit: number;
  aiCalls: number;
  aiLimit: number;
  plan: string;
}

export const apiClient = {
  projects: {
    scanUpload: async (file: File, projectId?: string): ApiResult<ScanResponse> => {
      const formData = new FormData();
      formData.append("file", file);

      const endpoint = projectId
        ? `/api/projects/${projectId}/scan-upload`
        : "/api/projects/scan";

      const res = await authenticatedFetch(endpoint, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error ?? `Upload failed: ${res.status}`);
      }
      return res.json();
    },
  },

  ai: {
    structured: async (tool: string, prompt: string, context?: Record<string, unknown>): ApiResult<AIStructuredResponse> => {
      const res = await authenticatedFetch("/api/ai/structured", {
        method: "POST",
        body: JSON.stringify({ tool, prompt, context }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "AI call failed" }));
        throw new Error(err.error ?? `AI call failed: ${res.status}`);
      }
      return res.json();
    },

    chat: async (messages: Array<{ role: string; content: string }>): ApiResult<{ reply: string }> => {
      const res = await authenticatedFetch("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Chat failed" }));
        throw new Error(err.error ?? `Chat failed: ${res.status}`);
      }
      return res.json();
    },
  },

  usage: {
    get: async (): ApiResult<UsageResponse> => {
      const res = await authenticatedFetch("/api/usage");
      if (!res.ok) throw new Error(`Usage fetch failed: ${res.status}`);
      return res.json();
    },
  },
};
