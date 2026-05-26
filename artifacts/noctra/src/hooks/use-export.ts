import { useState, useCallback } from "react";

type ExportFormat = "markdown" | "pdf" | "notion" | "linear" | "github-issues" | "csv";

interface ExportOptions {
  format: ExportFormat;
  reportId?: string;
  projectId?: string;
  includeTasks?: boolean;
  includeSignals?: boolean;
}

export function useExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = useCallback(async (options: ExportOptions) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        const data = await response.json();
        return data;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `noctra-export-${options.format}-${Date.now()}.${
        options.format === "pdf" ? "pdf" :
        options.format === "csv" ? "csv" :
        "md"
      }`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportToMarkdown = useCallback((reportId: string) => {
    return exportData({ format: "markdown", reportId });
  }, [exportData]);

  const exportToPdf = useCallback((reportId: string) => {
    return exportData({ format: "pdf", reportId });
  }, [exportData]);

  const exportToNotion = useCallback((projectId: string) => {
    return exportData({ format: "notion", projectId, includeTasks: true, includeSignals: true });
  }, [exportData]);

  const exportToLinear = useCallback((projectId: string) => {
    return exportData({ format: "linear", projectId, includeTasks: true });
  }, [exportData]);

  const exportToGithubIssues = useCallback((projectId: string) => {
    return exportData({ format: "github-issues", projectId, includeTasks: true });
  }, [exportData]);

  const exportToCsv = useCallback((projectId: string) => {
    return exportData({ format: "csv", projectId, includeTasks: true, includeSignals: true });
  }, [exportData]);

  return {
    loading,
    error,
    exportData,
    exportToMarkdown,
    exportToPdf,
    exportToNotion,
    exportToLinear,
    exportToGithubIssues,
    exportToCsv,
  };
}
