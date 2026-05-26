import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { callStructuredAI } from "@/lib/ai";
import { saveReport, getReports, getProjects } from "@/lib/repository";
import { generateTasksFromReport } from "@/lib/task-generator";
import { useProgression } from "@/lib/progression-context";
import { useToast } from "@/hooks/use-toast";
import {
  Stethoscope, Rocket, Upload, Loader2, RotateCcw, CheckCircle, Zap,
  ArrowRight, AlertTriangle, XCircle, Shield, FileCode, ArrowUpRight,
  TrendingUp, TrendingDown, Minus, RefreshCw,
} from "lucide-react";

type ToolMode = "doctor" | "launch";
type Phase = "idle" | "scanning" | "diagnosing" | "generating" | "done" | "error";

const MODES: Array<{ key: ToolMode; label: string; icon: typeof Stethoscope; color: string; description: string }> = [
  { key: "doctor", label: "Product Doctor", icon: Stethoscope, color: "var(--color-danger)", description: "Upload your repo. Get launch readiness, blockers, and fix queue." },
  { key: "launch", label: "Launch Room", icon: Rocket, color: "var(--color-warning)", description: "Readiness check, gate verification, and go/no-go decision." },
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
  const [result, setResult] = useState<any>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [contextReports, setContextReports] = useState<any[]>([]);
  const [loadingContext, setLoadingContext] = useState(false);
  const [doctorRedGates, setDoctorRedGates] = useState<string[]>([]);

  const currentMode = MODES.find((m) => m.key === mode)!;

  useEffect(() => {
    getProjects().then((p) => setProjects((p as any[]) ?? [])).catch(() => {});
    getReports("doctor").then((reps) => {
      const latest = (reps as any[])?.[0];
      if (!latest?.payload) return;
      const p = latest.payload as Record<string, unknown>;
      const data = (p.data ?? p) as Record<string, unknown>;
      if (!data) return;
      const gates = Array.isArray(data.gates) ? data.gates as Array<{ name: string; status: string }> : [];
      const redNames = gates.filter((g) => g.status === "RED").map((g) => g.name);
      setDoctorRedGates(redNames);
    }).catch(() => {});
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
    if (mode === "doctor" && !zipFile) {
      toast({ title: "Please upload a ZIP file", variant: "destructive" });
      return;
    }
    if (mode === "launch" && !input.trim()) return;

    setPhase("scanning");
    setError("");
    setResult(null);
    setSavedReportId(null);

    try {
      if (mode === "doctor") {
        setPhase("diagnosing");
        const formData = new FormData();
        formData.append("zip", zipFile!);
        if (selectedProjectId) formData.append("project_id", selectedProjectId);

        const response = await fetch("/api/scan", { method: "POST", body: formData });
        if (!response.ok) throw new Error("Scan failed");
        const scanResult = await response.json();

        setPhase("generating");
        const aiResult = await callStructuredAI("doctor", JSON.stringify(scanResult), {
          project_id: selectedProjectId || undefined,
        });

        setResult({ scan: scanResult, ai: aiResult });
        await autoSave(aiResult, "Product Doctor");
      } else {
        const context: Record<string, unknown> = {};
        if (selectedProjectId) context.project_id = selectedProjectId;
        if (contextReports.length > 0) {
          context.prior_analyses = contextReports.map((r) => ({
            tool: r.tool, title: r.title, score: r.score, summary: r.summary,
          }));
        }

        const res = await callStructuredAI("launch", input.trim(), Object.keys(context).length ? context : undefined);
        setResult(res);
        await autoSave(res, "Launch Room");
      }
      setPhase("done");
      refreshProgression();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setPhase("error");
    }
  }

  async function autoSave(res: any, title: string) {
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

  const d = result?.ai?.data || result?.data || {};
  const score = result?.ai?.score || result?.score || d?.health_score || d?.launch_score || null;
  const goNoGo = d?.go_no_go as string || d?.go_signal as string || null;
  const gates = Array.isArray(d?.gates) ? d.gates as Array<{ name: string; status: string }> : [];
  const redGates = gates.filter((g) => g.status === "RED").map((g) => g.name);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <motion.div {...fadeInUp} className="mb-6">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Code Health</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Scan codebases, diagnose launch blockers, and get go/no-go signals</p>
        </motion.div>

        <motion.div {...fadeInUp} className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.key;
            return (
              <motion.button
                key={m.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setMode(m.key); reset(); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background: active ? `${m.color}15` : "var(--surface-2)",
                  border: `1px solid ${active ? m.color : "var(--border-default)"}`,
                  color: active ? m.color : "var(--text-secondary)",
                }}
              >
                <Icon size={16} />
                {m.label}
              </motion.button>
            );
          })}
        </motion.div>

        {mode === "doctor" && doctorRedGates.length > 0 && (
          <motion.div
            {...fadeInUp}
            className="mb-6 px-5 py-4 rounded-xl flex items-start gap-4"
            style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger)" }}
          >
            <AlertTriangle size={18} style={{ color: "var(--color-danger)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-danger)" }}>
                {doctorRedGates.length} RED launch gate{doctorRedGates.length !== 1 ? "s" : ""} blocking GO signal
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{doctorRedGates.join(" · ")}</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            {...fadeInUp}
            className="rounded-xl border overflow-hidden"
            style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-md)" }}
          >
            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Input</span>
            </div>
            <div className="p-5 space-y-4">
              {mode === "doctor" ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? "border-[var(--accent-cyan)]" : ""}`}
                  style={{ borderColor: dragOver ? "var(--accent-cyan)" : "var(--border-default)", background: dragOver ? "var(--accent-cyan-soft)" : "var(--surface-2)" }}
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
                      <FileCode size={32} className="mx-auto" style={{ color: "var(--accent-cyan)" }} />
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{zipFile.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{(zipFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button onClick={() => setZipFile(null)} className="text-xs" style={{ color: "var(--color-danger)" }}>Remove</button>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Drop your repo ZIP here</p>
                      <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>or click to browse</p>
                      <input type="file" accept=".zip" onChange={handleFileSelect} className="hidden" id="zip-upload" />
                      <label htmlFor="zip-upload" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer" style={{ background: "var(--accent-cyan)", color: "#000" }}>
                        <Upload size={14} /> Select ZIP
                      </label>
                    </>
                  )}
                </div>
              ) : (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your product and launch status..."
                  rows={8}
                  disabled={phase !== "idle"}
                  className="w-full px-4 py-3 rounded-lg text-sm resize-none outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  maxLength={4000}
                />
              )}

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={run}
                  disabled={phase !== "idle" || (mode === "doctor" ? !zipFile : !input.trim())}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: phase !== "idle" ? "var(--surface-2)" : currentMode.color,
                    color: phase !== "idle" ? "var(--text-tertiary)" : "#000",
                    opacity: phase !== "idle" ? 0.5 : 1,
                  }}
                >
                  {phase !== "idle" ? <Loader2 size={16} className="animate-spin" /> : currentMode.icon && <currentMode.icon size={16} />}
                  {phase === "scanning" ? "Scanning..." : phase === "diagnosing" ? "Diagnosing..." : phase === "generating" ? "Generating..." : `Run ${currentMode.label}`}
                </motion.button>
                {phase !== "idle" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={reset}
                    className="px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
                  >
                    <RotateCcw size={16} />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            {...fadeInUp}
            className="rounded-xl border overflow-hidden"
            style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-md)" }}
          >
            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Output</span>
            </div>
            <div className="p-5">
              <AnimatePresence mode="wait">
                {phase === "idle" && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${currentMode.color}15` }}>
                      <currentMode.icon size={28} style={{ color: currentMode.color }} />
                    </div>
                    <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{currentMode.label} awaiting input</p>
                    <p className="text-xs" style={{ color: "var(--text-quaternary)" }}>{currentMode.description}</p>
                  </motion.div>
                )}

                {(phase === "scanning" || phase === "diagnosing" || phase === "generating") && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16">
                    <Loader2 size={32} className="animate-spin mb-4" style={{ color: currentMode.color }} />
                    <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                      {phase === "scanning" ? "Deep scanning codebase..." : phase === "diagnosing" ? "AI diagnosing launch blockers..." : "Generating fix tasks..."}
                    </p>
                  </motion.div>
                )}

                {phase === "done" && result && (
                  <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                    {score != null && (
                      <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Health Score</p>
                          <p className="text-3xl font-bold" style={{ color: score >= 70 ? "var(--color-success)" : score >= 40 ? "var(--color-warning)" : "var(--color-danger)" }}>
                            {score}
                          </p>
                        </div>
                        {goNoGo && (
                          <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{
                            background: goNoGo === "GO" ? "var(--color-success-soft)" : goNoGo === "NO-GO" ? "var(--color-danger-soft)" : "var(--color-warning-soft)",
                            color: goNoGo === "GO" ? "var(--color-success)" : goNoGo === "NO-GO" ? "var(--color-danger)" : "var(--color-warning)",
                          }}>
                            {goNoGo === "GO" ? "🟢 GO" : goNoGo === "NO-GO" ? "🔴 NO-GO" : "🟡 HOLD"}
                          </span>
                        )}
                      </div>
                    )}

                    {gates.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Gate Status</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {gates.slice(0, 6).map((gate, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: "var(--surface-2)" }}>
                              {gate.status === "GREEN" ? <CheckCircle size={12} style={{ color: "var(--color-success)" }} /> :
                               gate.status === "YELLOW" ? <AlertTriangle size={12} style={{ color: "var(--color-warning)" }} /> :
                               <XCircle size={12} style={{ color: "var(--color-danger)" }} />}
                              <span className="flex-1" style={{ color: "var(--text-secondary)" }}>{gate.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {savedReportId && (
                      <div className="flex gap-2 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate(`/app/reports/${savedReportId}`)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                          style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
                        >
                          <ArrowUpRight size={12} /> View Full Report
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}

                {phase === "error" && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16 text-center">
                    <AlertTriangle size={32} className="mb-4" style={{ color: "var(--color-danger)" }} />
                    <p className="text-sm font-medium mb-1" style={{ color: "var(--color-danger)" }}>Analysis failed</p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{error}</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={reset}
                      className="mt-4 px-4 py-2 rounded-lg text-xs font-medium"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
                    >
                      Try Again
                    </motion.button>
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
