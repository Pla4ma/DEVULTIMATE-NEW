import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useProgression } from "@/lib/progression-context";
import { callStructuredAI } from "@/lib/ai";
import { saveReport, saveScan, createScanSnapshot, createBlocker } from "@/lib/repository";
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
  projectId?: string;
};

export type AIResult = Awaited<ReturnType<typeof callStructuredAI>>;

export type BlockerInput = {
  title: string;
  severity: "P0" | "P1" | "P2";
  category: "security" | "performance" | "testing" | "deployment" | "docs" | "code" | "privacy" | "billing";
  evidence: string;
  why_it_matters: string;
  recommended_fix: string;
  acceptance_criteria: string;
};

export function useDoctorScan(projectId?: string) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { refreshProgression } = useProgression();
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

      const scanUrl = projectId
        ? `/api/projects/${projectId}/scan-upload`
        : "/api/projects/scan";

      const res = await authenticatedFetch(scanUrl, {
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
        payload: scan as Record<string, unknown>,
        projectId,
      }).catch(() => {});
    } catch (scanErr) {
      setScanFallbackMode("ai-only");
      const fallbackSummary = `Repository file: ${file.name} (${(file.size / 1024).toFixed(0)} KB). Full static scan unavailable.`;
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
        projectId,
      });
      const r = report as { id?: string } | null;
      const reportId = r?.id ?? null;
      setSavedReportId(reportId);

      // Extract blockers from AI result and save them (Task 2/3)
      const aiData = result.data as Record<string, unknown> | null;
      const blockersFromAI = (aiData?.blockers as BlockerInput[]) ?? [];
      if (blockersFromAI.length > 0 && reportId) {
        for (const blocker of blockersFromAI) {
          try {
            await createBlocker({
              projectId: projectId ?? "",
              title: blocker.title,
              severity: blocker.severity,
              category: blocker.category,
              evidence: blocker.evidence,
              whyItMatters: blocker.why_it_matters,
              recommendedFix: blocker.recommended_fix,
              acceptanceCriteria: blocker.acceptance_criteria,
              status: "open",
            });
          } catch (e) {
            console.warn("Failed to save blocker:", e);
          }
        }
      }

      // Generate tasks from report
      if (reportId) {
        const taskCount = await generateTasksFromReport({
          id: reportId,
          tool: "doctor",
          payload: { data: result.data },
          project_id: projectId ?? null,
        }).catch((taskErr) => {
          toast({ title: "Task generation failed", description: taskErr instanceof Error ? taskErr.message : "Could not generate fix tasks.", variant: "destructive" });
          return 0;
        });
        if (taskCount > 0) {
          toast({ title: `${taskCount} fix task${taskCount !== 1 ? "s" : ""} generated`, description: "Added to Task Queue." });
        }
      }

      // Create scan snapshot (Task 4)
      if (projectId && reportId) {
        try {
          await createScanSnapshot({
            projectId,
            reportId,
            score: result.score ?? undefined,
            blockers: blockersFromAI.map((b: BlockerInput, i: number) => ({
              id: `blocker-${i}`,
              title: b.title,
              severity: b.severity,
              category: b.category,
              status: "open",
            })),
            staticSignals: ((scan?.scan ?? {}) as Record<string, unknown>),
            generatedTasks: [],
            evidenceIndex: (scan?.evidenceIndex ?? []) as unknown[],
            summary: result.summary,
          });
        } catch (e) {
          console.warn("Failed to create scan snapshot:", e);
        }
      }

      setPhase("done");
      setTimeout(() => { try { refreshProgression(); } catch {} }, 0);
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
    phase, error, zipFile, scanResult, aiResult, savedReportId,
    dragOver, scanFallbackMode, fileRef,
    handleFileSelect, reset, navigate,
    setDragOver,
  };
}
