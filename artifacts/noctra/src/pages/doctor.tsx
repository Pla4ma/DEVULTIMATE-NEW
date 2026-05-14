import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { ToolScene } from "@/components/ToolScene";
import { DoctorReportView } from "@/components/reports/DoctorReportView";
import { EmptyState, NoctraButton, Panel, Badge } from "@/components/Primitives";
import { callStructuredAI } from "@/lib/ai";
import { saveReport, saveScan } from "@/lib/repository";
import { generateTasksFromReport } from "@/lib/task-generator";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { Stethoscope, Loader2, RotateCcw, Upload, FileArchive,
  CheckCircle, AlertTriangle, XCircle, ArrowRight, ExternalLink, Bug,
  Terminal, FileText, Rocket, FolderOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TOOL = TOOL_BY_KEY["doctor"]!;

type Phase = "idle" | "scanning" | "diagnosing" | "generating" | "done" | "error";
type ScanFallbackMode = "none" | "ai-only";

type ScanResult = {
  summaryMarkdown: string;
  launchGates?: Array<{ name: string; status: "GREEN" | "YELLOW" | "RED"; evidence?: string[]; how_to_fix?: string; why?: string }>;
  warnings?: string[];
  evidenceIndex?: Array<{ filePath: string; lineNumber?: number; snippet?: string; severity: string; explanation: string; signal: string }>;
  repoMap?: {
    components: string[];
    routes: string[];
    apiFiles: string[];
    hooks: string[];
    utilities: string[];
    services: string[];
    authFiles: string[];
    dbFiles: string[];
    aiFiles: string[];
    paymentFiles: string[];
    uploadFiles: string[];
    configFiles: string[];
    testFiles: string[];
    deploymentFiles: string[];
    docsFiles: string[];
  };
  scan?: {
    fileCount?: number;
    framework?: string;
    packageManager?: string;
    totalLines?: number;
    totalSize?: number;
    languages?: Record<string, number>;
    evidenceIndex?: Array<{ filePath: string; lineNumber?: number; snippet?: string; severity: string; explanation: string; signal: string }>;
    repoMap?: {
      components: string[];
      routes: string[];
      apiFiles: string[];
      hooks: string[];
      utilities: string[];
      services: string[];
      authFiles: string[];
      dbFiles: string[];
      aiFiles: string[];
      paymentFiles: string[];
      uploadFiles: string[];
      configFiles: string[];
      testFiles: string[];
      deploymentFiles: string[];
      docsFiles: string[];
    };
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
  { key: "scanning", label: "Deep scanning codebase and evaluating gates" },
  { key: "diagnosing", label: "AI diagnosing launch blockers and code risks" },
  { key: "generating", label: "Generating fix tasks, build prompt, and saving report" },
  { key: "done", label: "Diagnosis complete" },
];

const PHASE_ORDER: Record<Phase, number> = {
  idle: -1, scanning: 0, diagnosing: 1, generating: 2, done: 3, error: -1,
};

export default function DoctorPage() {
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

    // ── Step 1: Upload & scan ──────────────────────────────────────────────
    setPhase("scanning");
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
      }).catch((scanErr) => {
        toast({ title: "Scan save failed", description: "Scan results are visible but not stored.", variant: "destructive" });
      });
    } catch (scanErr) {
      // Scan failed — fall back to AI-only mode using file metadata
      setScanFallbackMode("ai-only");
      const fallbackSummary = `Repository file: ${file.name} (${(file.size / 1024).toFixed(0)} KB). Full static scan unavailable — running AI-only diagnostics based on file metadata.`;
      scan = { summaryMarkdown: fallbackSummary };
      setScanResult(scan);
    }

    // ── Step 2: AI analysis ────────────────────────────────────────────────
    try {
      setPhase("diagnosing");
      const context = scan?.scan ? { scan: scan.scan, launchGates: scan.launchGates } : {};
      const result = await callStructuredAI("doctor", scan?.summaryMarkdown ?? "", context as Record<string, unknown>);
      setAiResult(result);

      // ── Step 3: Save report and generate fix tasks ──────────────────────────
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
          if (file && phase === "idle") { handleFileSelect(file); }
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
              {phase === "scanning" ? "Deep scanning codebase…" : phase === "diagnosing" ? "AI diagnosing launch blockers…" : "Generating fix tasks and build prompt…"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Stethoscope size={26} style={{ color: TOOL.accent }} />
            <p className="text-sm font-semibold" style={{ color: "var(--noctra-text)" }}>Run Deep Diagnostic</p>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Drop your repo .zip here · or click to browse · max 50MB</p>
            <div className="flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-medium" style={{ background: `${TOOL.accent}14`, color: TOOL.accent }}>
              <ArrowRight size={10} /> Scans · Diagnoses · Generates fix tasks & build prompt
            </div>
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
          title="No diagnosis yet"
          body="Drop your repo ZIP. Noctra diagnoses launch blockers, code risks, and generates the exact tasks and build prompt to fix them."
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
      const aiData = aiResult.data as Record<string, unknown> | null;
      const healthScore = typeof aiData?.health_score === "number" ? aiData.health_score
        : typeof aiResult.score === "number" ? aiResult.score : null;
      const launchReadiness = typeof aiData?.launch_readiness === "string" ? aiData.launch_readiness : "";
      const redGates = (aiData?.red_gates as string[] ?? []);
      const yellowGates = (aiData?.yellow_gates as string[] ?? []);
      const topIssues = (aiData?.issues as string[] ?? []).slice(0, 5);
      const repairQueue = (aiData?.repair_queue as string[] ?? []).slice(0, 5);
      const healthColor = healthScore != null
        ? (healthScore >= 70 ? "var(--noctra-emerald)" : healthScore >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)")
        : "var(--noctra-text-muted)";

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
              <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Fix queue generated and added to Task Queue</p>
            </div>
          </div>

          {/* Health Score + Launch Readiness */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {healthScore != null && (
              <Panel>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--noctra-text-muted)" }}>Health Score</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold" style={{ color: healthColor }}>{healthScore}</span>
                  <span className="text-xs mb-1" style={{ color: "var(--noctra-text-muted)" }}>/ 100</span>
                </div>
              </Panel>
            )}
            {launchReadiness && (
              <Panel>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--noctra-text-muted)" }}>Launch Readiness</p>
                <p className="text-sm font-semibold" style={{
                  color: launchReadiness === "GO" ? "var(--noctra-emerald)" :
                         launchReadiness === "CONDITIONAL" ? "var(--noctra-amber)" : "var(--noctra-rose)"
                }}>{launchReadiness}</p>
              </Panel>
            )}
          </div>

          {/* Red/Yellow Gates */}
          {(redGates.length > 0 || yellowGates.length > 0) && (
            <Panel>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-rose)" }}>Launch Gates</p>
              <div className="space-y-1">
                {redGates.map((g, i) => (
                  <div key={`r-${i}`} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
                    <XCircle size={11} style={{ color: "var(--noctra-rose)" }} />
                    <span style={{ color: "var(--noctra-text)" }}>{g}</span>
                  </div>
                ))}
                {yellowGates.map((g, i) => (
                  <div key={`y-${i}`} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <AlertTriangle size={11} style={{ color: "var(--noctra-amber)" }} />
                    <span style={{ color: "var(--noctra-text)" }}>{g}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Top Issues */}
          {topIssues.length > 0 && (
            <Panel>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-rose)" }}>Top Issues</p>
              <div className="space-y-1">
                {topIssues.map((issue, i) => (
                  <p key={i} className="text-xs flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                    <span style={{ color: "var(--noctra-rose)" }}>—</span>{issue}
                  </p>
                ))}
              </div>
            </Panel>
          )}

          {/* Repair Queue */}
          {repairQueue.length > 0 && (
            <Panel>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-amber)" }}>Repair Queue</p>
              <div className="space-y-1">
                {repairQueue.map((item, i) => (
                  <p key={i} className="text-xs flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                    <span style={{ color: "var(--noctra-amber)" }}>→</span>{item}
                  </p>
                ))}
              </div>
            </Panel>
          )}

          {/* Evidence index from scan */}
          {scanResult?.evidenceIndex && scanResult.evidenceIndex.length > 0 && (
            <Panel>
              <div className="flex items-center gap-2 mb-2">
                <Bug size={13} style={{ color: "var(--noctra-amber)" }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Evidence Index</p>
                <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>{scanResult.evidenceIndex.length} items</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {scanResult.evidenceIndex.slice(0, 15).map((e, i) => (
                  <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: e.severity === "error" ? "var(--noctra-rose)" : e.severity === "warning" ? "var(--noctra-amber)" : "var(--noctra-cyan)" }} />
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>{e.filePath}{e.lineNumber ? `:${e.lineNumber}` : ""}</span>
                      <p className="mt-0.5" style={{ color: "var(--noctra-text-soft)" }}>{e.explanation || e.signal}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
          {scanResult?.scan && (
            <Panel>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Scan Summary</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {scanResult.scan.fileCount != null && <Badge>{scanResult.scan.fileCount} files</Badge>}
                {scanResult.scan.totalLines != null && <Badge>{scanResult.scan.totalLines} lines</Badge>}
                {scanResult.scan.framework && <Badge>{scanResult.scan.framework}</Badge>}
                {scanResult.scan.packageManager && <Badge>{scanResult.scan.packageManager}</Badge>}
                {scanResult.scan.languages && Object.entries(scanResult.scan.languages).slice(0, 6).map(([lang, lines]) => (
                  <Badge key={lang}>{lang} ({lines} lines)</Badge>
                ))}
              </div>
              {scanResult.repoMap && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-2">
                  {Object.entries(scanResult.repoMap).map(([key, files]) => {
                    if (!Array.isArray(files) || files.length === 0) return null;
                    return <Badge key={key} style={{ fontSize: "10px", justifyContent: "flex-start" }}>{key}: {files.length}</Badge>;
                  })}
                </div>
              )}
            </Panel>
          )}

          {scanResult?.warnings && scanResult.warnings.length > 0 && (
            <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--noctra-amber)" }}>Scan Warnings</p>
              {scanResult.warnings.slice(0, 3).map((w, i) => (
                <p key={i} className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{w}</p>
              ))}
            </div>
          )}
          <DoctorReportView report={{ id: savedReportId ?? "", payload: { data: aiResult.data, markdown: aiResult.markdown }, score: aiResult.score ?? null }} />

          {/* Next Build Prompt */}
          <Panel>
            <div className="flex items-center gap-2 mb-2">
              <Terminal size={13} style={{ color: "var(--noctra-cyan)" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Next Build Prompt</p>
            </div>
            <p className="text-xs mb-2" style={{ color: "var(--noctra-text-muted)" }}>
              Copy this prompt into Codex, Replit Agent, Cursor, or Windsurf to fix all identified issues.
            </p>
            <div className="flex gap-2 mb-2">
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(61,216,255,0.1)", color: "var(--noctra-cyan)" }}>Codex</span>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(61,216,255,0.1)", color: "var(--noctra-cyan)" }}>Replit</span>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(61,216,255,0.1)", color: "var(--noctra-cyan)" }}>Cursor</span>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(61,216,255,0.1)", color: "var(--noctra-cyan)" }}>Windsurf</span>
            </div>
            <div className="flex gap-2">
              {savedReportId && (
                <NoctraButton variant="ghost" onClick={() => navigate(`/app/reports/${savedReportId}`)}>
                  <Terminal size={11} /> Open Build Prompt
                </NoctraButton>
              )}
            </div>
          </Panel>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t" style={{ borderColor: "var(--noctra-border)" }}>
            {savedReportId && (
              <>
                <NoctraButton variant="ghost" onClick={() => navigate(`/app/reports/${savedReportId}`)}>
                  <FileText size={12} /> View Full Report
                </NoctraButton>
                <NoctraButton variant="ghost" onClick={() => navigate(`/app/tasks?report=${savedReportId}`)}>
                  <CheckCircle size={12} /> View Fix Tasks
                </NoctraButton>
                <NoctraButton variant="ghost" onClick={() => navigate(`/app/projects`)}>
                  <FolderOpen size={12} /> Link to Project
                </NoctraButton>
              </>
            )}
            <NoctraButton variant="ghost" onClick={() => navigate("/app/launch")}>
              <Rocket size={12} /> Launch Room
            </NoctraButton>
            <NoctraButton variant="ghost" onClick={() => navigate("/app/passport")}>
              <ExternalLink size={12} /> Passport
            </NoctraButton>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 p-2">
        <div className="text-center">
          <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: TOOL.accent }} />
          <p className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>
            {phase === "scanning" ? "Deep scanning repository structure and evaluating launch gates…" : phase === "diagnosing" ? "AI is diagnosing launch blockers, code risks, and missing requirements…" : "Generating fix tasks, next build prompt, and saving report…"}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>This takes 20–40 seconds</p>
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
