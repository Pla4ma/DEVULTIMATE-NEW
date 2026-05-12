import { useState, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { ToolScene } from "@/components/ToolScene";
import { DoctorReportView } from "@/components/reports/DoctorReportView";
import { EmptyState, NoctraButton, Panel, Badge } from "@/components/Primitives";
import { callStructuredAI } from "@/lib/ai";
import { saveReport, saveScan } from "@/lib/repository";
import { generateTasksFromReport } from "@/lib/task-generator";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import {
  Stethoscope, Loader2, RotateCcw, Upload, FileArchive,
  CheckCircle, AlertTriangle, XCircle, ArrowRight,
} from "lucide-react";

const TOOL = TOOL_BY_KEY["doctor"]!;

type Phase = "idle" | "uploading" | "analyzing" | "saving" | "done" | "error";
type ScanFallbackMode = "none" | "ai-only";

type ScanResult = {
  summaryMarkdown: string;
  launchGates?: Array<{ name: string; status: "GREEN" | "YELLOW" | "RED"; evidence?: string[] }>;
  warnings?: string[];
  scan?: {
    fileCount?: number;
    framework?: string;
    totalLines?: number;
    languages?: Record<string, number>;
  };
};

type AIResult = Awaited<ReturnType<typeof callStructuredAI>>;

const GATE_ICON = {
  GREEN: <CheckCircle size={13} style={{ color: "var(--noctra-emerald)" }} />,
  YELLOW: <AlertTriangle size={13} style={{ color: "var(--noctra-amber)" }} />,
  RED: <XCircle size={13} style={{ color: "var(--noctra-rose)" }} />,
};
const GATE_COLOR = {
  GREEN: "var(--noctra-emerald)",
  YELLOW: "var(--noctra-amber)",
  RED: "var(--noctra-rose)",
};

const STEPS: Array<{ key: Phase; label: string }> = [
  { key: "uploading", label: "Uploading & scanning" },
  { key: "analyzing", label: "AI diagnostics" },
  { key: "saving", label: "Saving report" },
  { key: "done", label: "Complete" },
];

const PHASE_ORDER: Record<Phase, number> = {
  idle: -1, uploading: 0, analyzing: 1, saving: 2, done: 3, error: -1,
};

export default function DoctorPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
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

    // ── Step 1: Upload & scan ──────────────────────────────────────────────
    setPhase("uploading");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/projects/scan-upload", {
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
      }).catch(() => {});
    } catch {
      // Scan failed — fall back to AI-only mode using file metadata
      setScanFallbackMode("ai-only");
      const fallbackSummary = `Repository file: ${file.name} (${(file.size / 1024).toFixed(0)} KB). Full static scan unavailable — running AI-only diagnostics based on file metadata.`;
      scan = { summaryMarkdown: fallbackSummary };
      setScanResult(scan);
    }

    // ── Step 2: AI analysis ────────────────────────────────────────────────
    try {
      setPhase("analyzing");
      const context = scan?.scan ? { scan: scan.scan, launchGates: scan.launchGates } : {};
      const result = await callStructuredAI("doctor", scan?.summaryMarkdown ?? "", context as Record<string, unknown>);
      setAiResult(result);

      // ── Step 3: Save report ────────────────────────────────────────────────
      setPhase("saving");
      const report = await saveReport({
        tool: "doctor",
        title: result.title || `Diagnostic Bay — ${file.name}`,
        payload: { data: result.data, markdown: result.markdown, scan },
        score: result.score ?? undefined,
        summary: result.summary,
      });
      if (report) {
        await generateTasksFromReport({
          id: report.id,
          tool: "doctor",
          payload: { data: result.data },
          project_id: null,
        }).catch(() => {});
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
    setScanFallbackMode("none");
  }

  const currentStep = PHASE_ORDER[phase];

  const InputPanel = (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file && phase === "idle") handleFileSelect(file).catch(() => {});
        }}
        onClick={() => phase === "idle" && fileRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-6 text-center transition-all"
        style={{
          borderColor: dragOver ? TOOL.accent : phase === "done" ? "var(--noctra-emerald)" : phase !== "idle" ? TOOL.accent : "var(--noctra-border)",
          background: dragOver ? `${TOOL.accent}08` : phase === "done" ? "rgba(16,185,129,0.05)" : "var(--noctra-surface2)",
          cursor: phase === "idle" ? "pointer" : "default",
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelect(f).catch(() => {});
          }}
        />
        {phase === "done" ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle size={22} style={{ color: "var(--noctra-emerald)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--noctra-emerald)" }}>{zipFile?.name}</p>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
              {scanResult?.scan?.fileCount ?? "?"} files · Report saved · Fix queue generated
            </p>
          </div>
        ) : phase !== "idle" ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={22} className="animate-spin" style={{ color: TOOL.accent }} />
            <p className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>{zipFile?.name}</p>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
              {phase === "uploading" ? "Scanning repository…" : phase === "analyzing" ? "Running AI diagnostics…" : "Saving report…"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FileArchive size={22} style={{ color: "var(--noctra-text-muted)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>Drop repo .zip here</p>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>or click to browse · max 50MB</p>
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--noctra-text-muted)" }}>
              <ArrowRight size={10} /> Upload once — Noctra scans, diagnoses, and saves automatically
            </p>
          </div>
        )}
      </div>

      {/* Scan gate indicators — shown after scan completes */}
      {scanResult?.launchGates && scanResult.launchGates.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Launch Gates</p>
          <div className="space-y-1.5">
            {scanResult.launchGates.slice(0, 6).map((gate, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--noctra-surface2)", border: `1px solid ${GATE_COLOR[gate.status]}22` }}>
                {GATE_ICON[gate.status]}
                <span className="text-xs flex-1" style={{ color: "var(--noctra-text)" }}>{gate.name}</span>
                <Badge style={{ background: `${GATE_COLOR[gate.status]}18`, color: GATE_COLOR[gate.status], fontSize: "10px" }}>{gate.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Error state */}
      {phase === "error" && error ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
            <AlertTriangle size={13} style={{ color: "var(--noctra-rose)", marginTop: 1 }} />
            <p className="text-xs" style={{ color: "var(--noctra-rose)" }}>{error}</p>
          </div>
          <NoctraButton variant="ghost" onClick={reset} className="w-full">
            <RotateCcw size={13} /> Try Again
          </NoctraButton>
        </div>
      ) : null}

      {phase === "done" ? (
        <NoctraButton variant="ghost" onClick={reset} className="w-full">
          <RotateCcw size={13} /> Diagnose Another Repo
        </NoctraButton>
      ) : null}
    </div>
  );

  const OutputPanel = (() => {
    if (phase === "idle") {
      return (
        <EmptyState
          icon={<Stethoscope size={22} />}
          title="No analysis yet"
          body="Drop a .zip of your repository. Noctra scans, diagnoses with AI, saves the report, and generates a fix queue — automatically."
        />
      );
    }

    if (phase === "error") {
      return (
        <EmptyState
          icon={<AlertTriangle size={22} />}
          title="Diagnosis failed"
          body={error || "Something went wrong. Check your repo zip and try again."}
        />
      );
    }

    if (phase === "done" && aiResult) {
      return (
        <div className="space-y-4">
          {scanFallbackMode === "ai-only" && (
            <div
              className="px-4 py-3 rounded-xl flex items-start gap-3"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}
            >
              <AlertTriangle size={14} style={{ color: "var(--noctra-amber)", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--noctra-amber)" }}>Static scan unavailable — AI-only mode</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>
                  The backend scan service was unreachable. Diagnostics below are based on AI analysis of file metadata only and may be less precise than a full scan.
                </p>
              </div>
            </div>
          )}
          <div
            className="px-4 py-3 rounded-xl flex items-center gap-3"
            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <CheckCircle size={14} style={{ color: "var(--noctra-emerald)" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--noctra-emerald)" }}>Diagnosis complete — report saved</p>
              <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Fix queue generated and added to Mission Queue</p>
            </div>
          </div>
          <DoctorReportView report={{ id: "", payload: { data: aiResult.data, markdown: aiResult.markdown }, score: aiResult.score ?? null }} />
        </div>
      );
    }

    return (
      <div className="space-y-6 p-2">
        <div className="text-center">
          <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: TOOL.accent }} />
          <p className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>
            {phase === "uploading" ? "Scanning repository structure…" : phase === "analyzing" ? "AI is diagnosing your codebase…" : "Saving report and generating fix queue…"}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>This takes 15–30 seconds</p>
        </div>

        {/* Step progress */}
        <Panel>
          <div className="space-y-3">
            {STEPS.map((step, i) => {
              const stepIdx = PHASE_ORDER[step.key] ?? -1;
              const isDone = currentStep > stepIdx;
              const isActive = currentStep === stepIdx;
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{
                      background: isDone ? "rgba(16,185,129,0.15)" : isActive ? `${TOOL.accent}18` : "var(--noctra-surface2)",
                      border: isDone ? "1px solid rgba(16,185,129,0.4)" : isActive ? `1px solid ${TOOL.accent}60` : "1px solid var(--noctra-border)",
                      color: isDone ? "var(--noctra-emerald)" : isActive ? TOOL.accent : "var(--noctra-text-muted)",
                    }}
                  >
                    {isDone ? "✓" : isActive ? <Loader2 size={10} className="animate-spin" /> : i + 1}
                  </div>
                  <span
                    className="text-xs"
                    style={{
                      color: isDone ? "var(--noctra-emerald)" : isActive ? "var(--noctra-text)" : "var(--noctra-text-muted)",
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {step.label}
                  </span>
                  {isActive ? (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${TOOL.accent}14`, color: TOOL.accent }}>
                      Running
                    </span>
                  ) : isDone ? (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "var(--noctra-emerald)" }}>
                      Done
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Languages detected — visible once scan is done */}
        {scanResult?.scan?.languages && Object.keys(scanResult.scan.languages).length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Languages Detected</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(scanResult.scan.languages).slice(0, 8).map(([lang, lines]) => (
                <Badge key={lang} style={{ background: `${TOOL.accent}18`, color: TOOL.accent }}>
                  {lang} ({lines} lines)
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {scanResult?.warnings && scanResult.warnings.length > 0 ? (
          <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--noctra-amber)" }}>Scan Warnings</p>
            {scanResult.warnings.slice(0, 3).map((w, i) => (
              <p key={i} className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{w}</p>
            ))}
          </div>
        ) : null}
      </div>
    );
  })();

  return (
    <AppShell>
      <ToolScene
        icon={Stethoscope}
        label={TOOL.label}
        accent={TOOL.accent}
        phase={phase === "done" ? "done" : phase === "error" ? "error" : phase === "idle" ? "idle" : "running"}
        inputPanel={InputPanel}
        outputPanel={OutputPanel}
        errorMessage={phase === "error" ? error : undefined}
      />
    </AppShell>
  );
}
