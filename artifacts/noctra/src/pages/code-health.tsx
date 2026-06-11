import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { ScanGuide } from "@/components/ScanGuide";
import { DemoBanner } from "@/components/DemoBanner";
import { ScoreRing } from "@/components/Primitives";
import { isDemoMode } from "@/lib/demo-mode";
import { motion, AnimatePresence } from "framer-motion";
import { callStructuredAI } from "@/lib/ai";
import { authenticatedFetch } from "@/lib/api-client";
import { saveReport, getReports, getProjects } from "@/lib/repository";
import { generateTasksFromReport } from "@/lib/task-generator";
import { useProgression } from "@/lib/progression-context";
import { useToast } from "@/hooks/use-toast";
import { ObsidianButton } from "@/components/ObsidianButton";
import {
  Stethoscope, Rocket, Upload, Loader2, RotateCcw, CheckCircle, Zap,
  ArrowRight, AlertTriangle, XCircle, Shield, FileCode, ArrowUpRight,
  TrendingUp, TrendingDown, Minus, RefreshCw,
} from "lucide-react";

type ToolMode = "doctor" | "launch";
type Phase = "idle" | "scanning" | "diagnosing" | "generating" | "done" | "error";

interface ScanResult {
  files_analyzed?: number;
  frameworks?: string[];
  issues?: Array<{ severity: string; message: string; file?: string }>;
}

interface AIResult {
  score?: number;
  go_signal?: string;
  go_no_go?: string;
  gates?: Array<{ name: string; status: string }>;
  data?: Record<string, unknown>;
  title?: string;
  summary?: string;
  markdown?: string;
}

interface ScanOutput {
  scan?: ScanResult;
  ai?: AIResult;
}

interface Project {
  id: string;
  name: string;
  stage?: string | null;
}

interface ContextReport {
  id: string;
  tool: string;
  title: string;
  score?: number | null;
  summary?: string | null;
  payload?: unknown;
}

const MODES: Array<{ key: ToolMode; label: string; icon: typeof Stethoscope; color: string; description: string }> = [
  { key: "doctor", label: "Product Doctor", icon: Stethoscope, color: "#8b5cf6", description: "Upload your repo. Get launch readiness, blockers, and fix queue." },
  { key: "launch", label: "Launch Room", icon: Rocket, color: "#f97316", description: "Readiness check, gate verification, and go/no-go decision." },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function CodeHealthPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { refreshProgression } = useProgression();

  const [mode, setMode] = useState<ToolMode>("doctor");
  const [phase, setPhase] = useState<Phase>("idle");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScanOutput | null>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [contextReports, setContextReports] = useState<ContextReport[]>([]);
  const [loadingContext, setLoadingContext] = useState(false);
  const [doctorRedGates, setDoctorRedGates] = useState<string[]>([]);

  const currentMode = MODES.find((m) => m.key === mode)!;

  useEffect(() => {
    getProjects().then((p) => setProjects((p as Project[]) ?? [])).catch((e) => {
      console.error("Failed to load projects:", e);
    });
    getReports("doctor").then((reps) => {
      const latest = (reps as ContextReport[])?.[0];
      if (!latest?.payload) return;
      const p = latest.payload as Record<string, unknown>;
      const data = (p.data ?? p) as Record<string, unknown>;
      if (!data) return;
      const gates = Array.isArray(data.gates) ? data.gates as Array<{ name: string; status: string }> : [];
      const redNames = gates.filter((g) => g.status === "RED").map((g) => g.name);
      setDoctorRedGates(redNames);
      if (isDemoMode() && latest) {
        const aiResult: AIResult = {
          score: typeof data.health_score === "number" ? data.health_score : undefined,
          go_signal: typeof data.go_no_go === "string" ? data.go_no_go : undefined,
          gates: Array.isArray(data.gates) ? data.gates as Array<{ name: string; status: string }> : [],
          data: data,
          title: typeof latest.title === "string" ? latest.title : "Latest Scan",
          summary: typeof latest.summary === "string" ? latest.summary : undefined,
        };
        setResult({ ai: aiResult });
        setSavedReportId(latest.id);
        setPhase("done");
      }
    }).catch((e) => {
      console.error("Failed to load doctor reports:", e);
    });
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (phase === "idle" && (input.trim() || zipFile)) void run();
    }
  }, [phase, input, zipFile, mode]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  async function run() {
    if (mode === "doctor" && !zipFile && !isDemoMode()) {
      toast({ title: "Please upload a ZIP file", variant: "destructive" });
      return;
    }
    if (mode === "launch" && !input.trim() && !isDemoMode()) return;

    setPhase("scanning");
    setError("");
    setResult(null);
    setSavedReportId(null);

    try {
      if (mode === "doctor") {
        setPhase("diagnosing");
        
        let scanResult: ScanResult;
        let aiResult: AIResult;

        if (isDemoMode()) {
          // Demo mode mock response
          await new Promise(r => setTimeout(r, 1500));
          setPhase("generating");
          await new Promise(r => setTimeout(r, 1500));
          scanResult = { 
            files_analyzed: 45, 
            frameworks: ["React", "Express"], 
            issues: [] 
          };
          aiResult = {
            score: 72,
            go_signal: "HOLD",
            gates: [
              { name: "Auth Provider Security", status: "YELLOW" },
              { name: "Production DB Config", status: "RED" },
              { name: "API Rate Limiting", status: "RED" },
              { name: "CI/CD Pipeline", status: "GREEN" }
            ],
            data: {
              health_score: 72,
              go_no_go: "HOLD",
              gates: [
                { name: "Auth Provider Security", status: "YELLOW" },
                { name: "Production DB Config", status: "RED" },
                { name: "API Rate Limiting", status: "RED" },
                { name: "CI/CD Pipeline", status: "GREEN" }
              ]
            },
            title: "Demo Scan Result",
            summary: "Sample scan showing 2 launch blockers."
          };
        } else {
          const formData = new FormData();
          formData.append("file", zipFile!);

          const scanUrl = selectedProjectId
            ? `/api/projects/${selectedProjectId}/scan-upload`
            : "/api/projects/scan";

          const response = await authenticatedFetch(scanUrl, { method: "POST", body: formData });
          if (!response.ok) {
            const errBody = await response.json().catch(() => ({ error: "Scan failed" })) as { error?: string };
            throw new Error(errBody.error ?? `Scan failed: ${response.status}`);
          }
          scanResult = await response.json() as ScanResult;

          setPhase("generating");
          aiResult = await callStructuredAI("doctor", JSON.stringify(scanResult), {
            project_id: selectedProjectId || undefined,
          }) as AIResult;
        }

        setResult({ scan: scanResult, ai: aiResult });
        await autoSave(aiResult, "Product Doctor");
      } else {
        let res: AIResult;
        
        if (isDemoMode()) {
          await new Promise(r => setTimeout(r, 2000));
          res = {
            score: 85,
            go_no_go: "GO",
            data: { health_score: 85, go_no_go: "GO", gates: [] },
            title: "Demo Launch Check",
            summary: "Your product looks ready to launch!"
          };
        } else {
          const context: Record<string, unknown> = {};
          if (selectedProjectId) context.project_id = selectedProjectId;
          if (contextReports.length > 0) {
            context.prior_analyses = contextReports.map((r) => ({
              tool: r.tool, title: r.title, score: r.score, summary: r.summary,
            }));
          }
          res = await callStructuredAI("launch", input.trim(), Object.keys(context).length ? context : undefined) as AIResult;
        }
        setResult({ ai: res });
        await autoSave(res, "Launch Room");
      }
      setPhase("done");
      refreshProgression();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setPhase("error");
    }
  }

  async function autoSave(res: AIResult, title: string) {
    try {
      const report = await saveReport({
        tool: mode,
        title: res.title || title,
        payload: { data: res.data, markdown: res.markdown },
        score: res.score ?? undefined,
        summary: res.summary,
        projectId: selectedProjectId || undefined,
      });
      const r = report as { id?: string } | null;
      setSavedReportId(r?.id ?? null);
      if (r?.id) await generateTasksFromReport({ id: r.id, tool: mode, payload: { data: res.data }, project_id: selectedProjectId || null });
    } catch (e) {
      toast({ title: "Auto-save failed", variant: "destructive" });
    }
  }

  function reset() {
    setPhase("idle");
    setResult(null);
    setError("");
    setSavedReportId(null);
    setInput("");
    setZipFile(null);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".zip")) {
      setZipFile(file);
    } else {
      toast({ title: "Please select a ZIP file", variant: "destructive" });
    }
  }

  const d = result?.ai?.data || {};
  const score = result?.ai?.score || (d?.health_score as number) || (d?.launch_score as number) || null;
  const goNoGo = (d?.go_no_go as string) || result?.ai?.go_signal || null;
  const gates = Array.isArray(d?.gates) ? d.gates as Array<{ name: string; status: string }> : [];
  const redGates = gates.filter((g) => g.status === "RED").map((g) => g.name);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <DemoBanner />
        <motion.div {...fadeInUp} className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "#fff" }}>Code Health</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Scan codebases, diagnose launch blockers, and get go/no-go signals</p>
        </motion.div>

        {isDemoMode() && (
          <motion.div
            {...fadeInUp}
            className="mb-6 px-5 py-4 rounded-xl"
            style={{ background: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.12)" }}
          >
            <p className="text-sm font-medium" style={{ color: "#f97316" }}>
              Demo mode uses sample scans. Sign in to scan your own repo.
            </p>
          </motion.div>
        )}

        <motion.div {...fadeInUp} className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => { setMode(m.key); reset(); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background: active ? `${m.color}15` : "rgba(20, 18, 40, 0.5)",
                  border: `1px solid ${active ? m.color : "rgba(139, 92, 246, 0.12)"}`,
                  color: active ? m.color : "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <Icon size={16} />
                {m.label}
              </button>
            );
          })}
        </motion.div>

        {mode === "doctor" && doctorRedGates.length > 0 && (
          <motion.div
            {...fadeInUp}
            className="mb-6 px-5 py-4 rounded-xl flex items-start gap-4"
            style={{ background: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.12)" }}
          >
            <AlertTriangle size={18} style={{ color: "#f97316", flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#f97316" }}>
                {doctorRedGates.length} RED launch gate{doctorRedGates.length !== 1 ? "s" : ""} blocking GO signal
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{doctorRedGates.join(" · ")}</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            {...fadeInUp}
            className="glass overflow-hidden"
          >
            <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(139, 92, 246, 0.12)" }}>
              <span className="text-xs font-medium tracking-[0.12em] uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>Input</span>
            </div>
            <div className="p-5 space-y-4">
              {mode === "doctor" && !isDemoMode() && <ScanGuide />}
              {mode === "doctor" ? (
                isDemoMode() ? (
                  <div
                    className="border-2 border-dashed rounded-xl p-8 text-center"
                    style={{ background: "rgba(20, 18, 40, 0.5)", borderColor: "rgba(139, 92, 246, 0.12)", backdropFilter: "blur(12px)" }}
                  >
                    <Upload size={32} className="mx-auto mb-3" style={{ color: "rgba(255,255,255,0.5)" }} />
                    <p className="text-sm font-medium mb-1" style={{ color: "#fff" }}>Demo mode</p>
                    <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Sign in to scan your own projects</p>
                    <ObsidianButton
                      variant="primary"
                      size="sm"
                      onClick={run}
                      disabled={phase !== "idle"}
                    >
                      <Zap size={14} /> Run Demo Scan
                    </ObsidianButton>
                  </div>
                ) : (
                <div
                  className="border-2 border-dashed rounded-xl p-8 text-center transition-colors"
                  style={{ borderColor: dragOver ? "#f97316" : "rgba(139, 92, 246, 0.12)", background: dragOver ? "rgba(249, 115, 22, 0.15)" : "rgba(20, 18, 40, 0.5)", backdropFilter: "blur(12px)" }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file?.name.endsWith(".zip")) setZipFile(file);
                  }}
                >
                  {zipFile ? (
                    <div className="space-y-3">
                      <FileCode size={32} className="mx-auto" style={{ color: "#f97316" }} />
                      <p className="text-sm font-medium" style={{ color: "#fff" }}>{zipFile.name}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{(zipFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button onClick={() => setZipFile(null)} className="text-xs" style={{ color: "#f97316" }}>Remove</button>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className="mx-auto mb-3" style={{ color: "rgba(255,255,255,0.5)" }} />
                      <p className="text-sm font-medium mb-1" style={{ color: "#fff" }}>Drop your repo ZIP here</p>
                      <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>or click to browse</p>
                      <input type="file" accept=".zip" onChange={handleFileSelect} className="hidden" id="zip-upload" />
                      <label htmlFor="zip-upload" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #f97316 100%)", color: "#fff" }}>
                        <Upload size={14} /> Select ZIP
                      </label>
                    </>
                  )}
                </div>
                )
              ) : (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your product and launch status..."
                  rows={8}
                  disabled={phase !== "idle"}
                  className="w-full px-4 py-3 rounded-lg text-sm resize-none outline-none focus:border-[#f97316] focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)]"
                  style={{ background: "rgba(20, 18, 40, 0.5)", border: "1px solid rgba(139, 92, 246, 0.12)", color: "#fff", backdropFilter: "blur(12px)" }}
                  maxLength={4000}
                />
              )}

              <div className="flex gap-3">
                <ObsidianButton
                  variant="primary"
                  onClick={run}
                  disabled={phase !== "idle" || (mode === "doctor" ? !zipFile : !input.trim())}
                  className="flex-1"
                >
                  {phase !== "idle" ? <Loader2 size={16} className="animate-spin" /> : currentMode.icon && <currentMode.icon size={16} />}
                  {phase === "scanning" ? "Scanning..." : phase === "diagnosing" ? "Diagnosing..." : phase === "generating" ? "Generating..." : `Run ${currentMode.label}`}
                </ObsidianButton>
                {phase !== "idle" && (
                  <ObsidianButton
                    variant="secondary"
                    size="sm"
                    onClick={reset}
                  >
                    <RotateCcw size={16} />
                  </ObsidianButton>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            {...fadeInUp}
            className="glass overflow-hidden"
          >
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(139, 92, 246, 0.12)" }}>
              <span className="text-xs font-medium tracking-[0.12em] uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>Output</span>
            </div>
            <div className="p-5">
              <AnimatePresence mode="wait">
                {phase === "idle" && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${currentMode.color}15` }}>
                      <currentMode.icon size={28} style={{ color: currentMode.color }} />
                    </div>
                    <p className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>{currentMode.label} awaiting input</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{currentMode.description}</p>
                  </motion.div>
                )}

                {(phase === "scanning" || phase === "diagnosing" || phase === "generating") && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16">
                    <Loader2 size={32} className="animate-spin mb-4" style={{ color: currentMode.color }} />
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {phase === "scanning" ? "Deep scanning codebase..." : phase === "diagnosing" ? "AI diagnosing launch blockers..." : "Generating fix tasks..."}
                    </p>
                  </motion.div>
                )}

                {phase === "done" && result && (
                  <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                    {score != null && (
                      <div className="flex items-center gap-5 p-5 rounded-xl" style={{ background: "rgba(20, 18, 40, 0.5)", border: "1px solid rgba(139, 92, 246, 0.12)", backdropFilter: "blur(12px)" }}>
                        <ScoreRing value={score} size={80} stroke={7} label="Health" color={score >= 70 ? "var(--color-success)" : score >= 40 ? "var(--color-warning)" : "var(--color-danger)"} />
                        <div className="flex-1">
                          <p className="text-xs font-medium tracking-[0.12em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>Health Score</p>
                          <p className="text-3xl font-bold font-mono" style={{ color: score >= 70 ? "var(--color-success)" : score >= 40 ? "var(--color-warning)" : "var(--color-danger)" }}>
                            {score}<span className="text-sm font-normal" style={{ color: "rgba(255,255,255,0.6)" }}>/100</span>
                          </p>
                          {goNoGo && (
                            <span className="text-xs font-medium tracking-[0.12em] uppercase mt-2 inline-block px-3 py-1 rounded-full" style={{
                              background: goNoGo === "GO" ? "var(--color-success-soft)" : goNoGo === "NO-GO" ? "var(--color-danger-soft)" : "var(--color-warning-soft)",
                              color: goNoGo === "GO" ? "var(--color-success)" : goNoGo === "NO-GO" ? "var(--color-danger)" : "var(--color-warning)",
                            }}>
                              {goNoGo === "GO" ? "GO SIGNAL" : goNoGo === "NO-GO" ? "NO-GO" : "HOLD"}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {gates.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium tracking-[0.12em] uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>Gate Status</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {gates.slice(0, 6).map((gate, i) => (
                            <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg" style={{ background: "rgba(20, 18, 40, 0.5)", border: "1px solid rgba(139, 92, 246, 0.12)", backdropFilter: "blur(12px)" }}>
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: gate.status === "GREEN" ? "var(--color-success)" : gate.status === "YELLOW" ? "var(--color-warning)" : "var(--color-danger)", boxShadow: `0 0 6px ${gate.status === "GREEN" ? "var(--color-success)" : gate.status === "YELLOW" ? "var(--color-warning)" : "var(--color-danger)"}` }} />
                              <span className="text-sm flex-1" style={{ color: "#fff" }}>{gate.name}</span>
                              <span className="font-mono text-[10px] font-medium" style={{ color: gate.status === "GREEN" ? "var(--color-success)" : gate.status === "YELLOW" ? "var(--color-warning)" : "var(--color-danger)" }}>{gate.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {savedReportId && (
                      <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid rgba(139, 92, 246, 0.12)" }}>
                        <ObsidianButton
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/app/reports/${savedReportId}`)}
                        >
                          <ArrowUpRight size={12} /> View Full Report
                        </ObsidianButton>
                      </div>
                    )}
                  </motion.div>
                )}

                {phase === "error" && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16 text-center">
                    <AlertTriangle size={32} className="mb-4" style={{ color: "#f97316" }} />
                    <p className="text-sm font-medium mb-1" style={{ color: "#f97316" }}>Analysis failed</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{error}</p>
                    <ObsidianButton
                      variant="secondary"
                      size="sm"
                      onClick={reset}
                      className="mt-4"
                    >
                      Try Again
                    </ObsidianButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
