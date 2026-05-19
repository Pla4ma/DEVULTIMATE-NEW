import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { callStructuredAI } from "@/lib/ai";
import { saveReport, saveScan } from "@/lib/repository";
import { generateTasksFromReport } from "@/lib/task-generator";
import { authenticatedFetch } from "@/lib/api-client";

export type Phase = "idle" | "scanning" | "diagnosing" | "generating" | "done" | "error";
export type ScanFallbackMode = "none" | "ai-only";

export type ScanResult = {
  summaryMarkdown: string;
  launchGates?: Array<{ name: string; status: "GREEN" | "YELLOW" | "RED"; evidence?: string[]; how_to_fix?: string; why?: string }>;
  warnings?: string[];
  evidenceIndex?: Array<{ filePath: string; lineNumber?: number; snippet?: string; severity: string; explanation: string; signal: string }>;
  repoMap?: Record<string, string[]>;
  scan?: {
    fileCount?: number;
    framework?: string;
    packageManager?: string;
    totalLines?: number;
    totalSize?: number;
    languages?: Record<string, number>;
    evidenceIndex?: Array<{ filePath: string; lineNumber?: number; snippet?: string; severity: string; explanation: string; signal: string }>;
    repoMap?: Record<string, string[]>;
  };
};

export type AIResult = Awaited<ReturnType<typeof callStructuredAI>>;

export function useDoctorScan() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [scanFallbackMode, setScanFallbackMode] = useState<ScanFallbackMode>("none");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(file: File) {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setError("Only .zip files are accepted");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File too large. Maximum size is 50MB.");
      return;
    }
    setZipFile(file);
    setError("");
    await runFullFlow(file);
  }

  async function runFullFlow(file: File) {
    setScanFallbackMode("none");
    let scan: ScanResult | null = null;

    setPhase("scanning");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await authenticatedFetch("/api/projects/scan-upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" })) as { error?: string };
        throw new Error(err.error ?? `Upload failed: ${res.status}`);
      }

      scan = await res.json() as ScanResult;
      setScanResult(scan);

      await saveScan({
        fileName: file.name,
        summary: scan.summaryMarkdown ?? "",
        payload: scan as unknown as Record<string, unknown>,
      }).catch(() => {
        toast({ title: "Scan save failed", description: "Scan results are visible but not stored.", variant: "destructive" });
      });
    } catch (scanErr) {
      setScanFallbackMode("ai-only");
      const fallbackSummary = `Repository file: ${file.name} (${(file.size / 1024).toFixed(0)} KB). Full static scan unavailable — running AI-only diagnostics based on file metadata.`;
      scan = { summaryMarkdown: fallbackSummary };
      setScanResult(scan);
    }

    try {
      setPhase("diagnosing");
      const context = scan?.scan ? { scan: scan.scan, launchGates: scan.launchGates } : {};
      const result = await callStructuredAI("doctor", scan?.summaryMarkdown ?? "", context as Record<string, unknown>);
      setAiResult(result);

      setPhase("generating");
      const report = await saveReport({
        tool: "doctor",
        title: result.title || `Project Doctor — ${file.name}`,
        payload: { data: result.data, markdown: result.markdown, scan },
        score: result.score ?? undefined,
        summary: result.summary,
      });
      const r = report as { id?: string } | null;
      setSavedReportId(r?.id ?? null);
      if (r?.id) {
        const taskCount = await generateTasksFromReport({
          id: r.id,
          tool: "doctor",
          payload: { data: result.data },
          project_id: null,
        }).catch((taskErr) => {
          toast({ title: "Task generation failed", description: taskErr instanceof Error ? taskErr.message : "Could not generate fix tasks.", variant: "destructive" });
          return 0;
        });
        if (taskCount > 0) {
          toast({ title: `${taskCount} fix task${taskCount !== 1 ? "s" : ""} generated`, description: "Added to Task Queue." });
        }
      }

      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Diagnosis failed");
      setPhase("error");
    }
  }

  function reset() {
    setPhase("idle");
    setAiResult(null);
    setScanResult(null);
    setError("");
    setZipFile(null);
    setSavedReportId(null);
    setScanFallbackMode("none");
  }

  return {
    phase, error, zipFile, scanResult, aiResult, savedReportId, dragOver, scanFallbackMode, fileRef,
    handleFileSelect, reset, navigate,
    setDragOver,
  };
}
