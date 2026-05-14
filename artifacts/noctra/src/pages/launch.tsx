import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { ToolScene } from "@/components/ToolScene";
import { LaunchReportView } from "@/components/reports/LaunchReportView";
import { EmptyState, NoctraButton, Panel, Badge } from "@/components/Primitives";
import { callStructuredAI } from "@/lib/ai";
import { saveReport, getProjects, getReports } from "@/lib/repository";
import { generateTasksFromReport } from "@/lib/task-generator";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { Rocket, Wand2, Loader2, RotateCcw, CheckCircle, FolderOpen, RefreshCw, AlertTriangle, ExternalLink, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TOOL = TOOL_BY_KEY["launch"]!;
type Phase = "idle" | "running" | "done" | "error";
type Project = { id: string; name: string; stage?: string | null };
type Report = { id: string; tool: string; title: string; summary?: string | null; score?: number | null };

export default function LaunchPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Awaited<ReturnType<typeof callStructuredAI>> | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [contextReports, setContextReports] = useState<Report[]>([]);
  const [loadingContext, setLoadingContext] = useState(false);
  const [doctorRedGates, setDoctorRedGates] = useState<string[]>([]);

  useEffect(() => {
    getProjects()
      .then((p) => setProjects((p as Project[]) ?? []))
      .catch(() => setProjects([]));

    // Load latest doctor report to surface RED gate warnings
    getReports("doctor")
      .then((reps) => {
        const latest = ((reps as Array<{ payload: unknown }>) ?? [])[0];
        if (!latest?.payload) return;
        const p = latest.payload as Record<string, unknown>;
        const data = (p.data ?? p) as Record<string, unknown> | null;
        if (!data) return;
        const gates = Array.isArray(data.gates) ? data.gates as Array<{ name: string; status: string }> : [];
        const redNames = gates.filter((g) => g.status === "RED").map((g) => g.name);
        setDoctorRedGates(redNames);
      })
      .catch(() => {});
  }, []);

  async function loadProjectContext(projectId: string) {
    if (!projectId) { setContextReports([]); return; }
    setLoadingContext(true);
    try {
      const reps = await getReports(undefined, projectId);
      const recent = ((reps as Report[]) ?? []).slice(0, 5);
      setContextReports(recent);
      const summary = recent.map((r) => `${r.tool} analysis: "${r.title}" (score: ${r.score ?? "N/A"}) — ${r.summary ?? "no summary"}`).join("\n");
      if (summary && !input.trim()) {
        setInput(summary);
      }
    } catch (e) { setContextReports([]); toast({ title: "Failed to load project context", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }); } finally { setLoadingContext(false); }
  }

  async function run() {
    if (!input.trim()) return;
    setPhase("running"); setError(""); setResult(null); setSaved(false); setSavedReportId(null);
    const context: Record<string, unknown> = {};
    if (selectedProjectId) context.project_id = selectedProjectId;
    if (contextReports.length > 0) {
      context.prior_analyses = contextReports.map((r) => ({
        tool: r.tool, title: r.title, score: r.score, summary: r.summary,
      }));
    }
    try {
      const res = await callStructuredAI("launch", input.trim(), Object.keys(context).length ? context : undefined);
      setResult(res);
      setPhase("done");
      void autoSave(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setPhase("error");
    }
  }

  async function autoSave(res: Awaited<ReturnType<typeof callStructuredAI>>) {
    try {
      const report = await saveReport({
        tool: "launch",
        title: res.title || `Launch Room — ${input.slice(0, 60)}`,
        payload: { data: res.data, markdown: res.markdown },
        score: res.score ?? undefined,
        summary: res.summary,
        projectId: selectedProjectId || undefined,
      });
      const r = report as { id?: string } | null;
      setSavedReportId(r?.id ?? null);
      if (r?.id) await generateTasksFromReport({ id: r.id, tool: "launch", payload: { data: res.data }, project_id: selectedProjectId || null });
      setSaved(true);
    } catch (e) {
      toast({ title: "Auto-save failed", description: e instanceof Error ? e.message : "Report results visible but not stored.", variant: "destructive" });
    }
  }

  function reset() {
    setPhase("idle"); setResult(null); setError(""); setSaved(false); setSavedReportId(null);
    setInput(""); setContextReports([]); setSelectedProjectId("");
  }

  const d = result?.data as Record<string, unknown> | null;
  const goNoGo = d?.go_no_go as string | undefined;
  const goColor = goNoGo === "GO" ? "var(--noctra-emerald)" : goNoGo === "NO-GO" ? "var(--noctra-rose)" : "var(--noctra-amber)";
  const launchChecklist = Array.isArray(d?.launch_checklist) ? d!.launch_checklist as Array<{ item: string; done: boolean } | string> : [];

  const InputPanel = (
    <div className="space-y-4">
      {/* Doctor RED gate warning — critical blocker */}
      {doctorRedGates.length > 0 && (
        <div
          className="px-4 py-3 rounded-xl flex items-start gap-3"
          style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.3)" }}
        >
          <AlertTriangle size={16} style={{ color: "var(--noctra-rose)", flexShrink: 0, marginTop: 1 }} />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: "var(--noctra-rose)" }}>
              {doctorRedGates.length} RED launch gate{doctorRedGates.length !== 1 ? "s" : ""} blocking GO signal
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>
              {doctorRedGates.join(" · ")}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--noctra-rose)" }}>
              These gates must pass before launch. Run Project Doctor to fix them.
            </p>
            <button
              onClick={() => navigate("/app/doctor")}
              className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "var(--noctra-rose)", color: "#000" }}
            >
              Open Project Doctor <ArrowRight size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Project selector */}
      {projects.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen size={13} style={{ color: "var(--noctra-text-muted)" }} />
            <label className="text-xs font-medium" style={{ color: "var(--noctra-text-muted)" }}>Load context from project</label>
          </div>
          <div className="flex gap-2 flex-wrap">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  const newId = selectedProjectId === p.id ? "" : p.id;
                  setSelectedProjectId(newId);
                  if (newId) loadProjectContext(newId).catch((err) => toast({ title: "Failed to load context", description: err?.message, variant: "destructive" }));
                  else setContextReports([]);
                }}
                disabled={loadingContext}
                className="px-2.5 py-1 rounded-full text-xs transition-all"
                style={{
                  background: selectedProjectId === p.id ? `${TOOL.accent}20` : "var(--noctra-surface2)",
                  border: `1px solid ${selectedProjectId === p.id ? TOOL.accent : "var(--noctra-border)"}`,
                  color: selectedProjectId === p.id ? TOOL.accent : "var(--noctra-text-muted)",
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
          {loadingContext && (
            <div className="flex items-center gap-2 mt-2">
              <Loader2 size={11} className="animate-spin" style={{ color: TOOL.accent }} />
              <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Loading context…</span>
            </div>
          )}
          {contextReports.length > 0 && (
            <div className="mt-2 px-3 py-2 rounded-lg text-xs" style={{ background: `${TOOL.accent}08`, border: `1px solid ${TOOL.accent}20`, color: TOOL.accent }}>
              {contextReports.length} report{contextReports.length !== 1 ? "s" : ""} loaded as context
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>
          Describe your product and launch status
        </label>
        <textarea
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. SaaS tool for indie hackers. Built for 3 months. MVP is working. Have 50 beta users, 3 paid. No formal marketing yet. Planning Product Hunt launch next week."
          rows={7} disabled={phase === "running"}
          className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none"
          style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
        />
          {contextReports.length > 0 && (
            <button onClick={() => loadProjectContext(selectedProjectId).catch((err) => toast({ title: "Failed to reload context", description: err?.message, variant: "destructive" }))} className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: "var(--noctra-text-muted)" }}>
              <RefreshCw size={10} /> Reload context into input
            </button>
          )}
          {projects.length === 0 && phase === "idle" && !input.trim() && (
            <div className="flex gap-2 mt-2">
              <button onClick={() => setInput("I have validated my idea, planned the MVP, and scanned my codebase. Ready for launch assessment.")} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(61,216,255,0.1)", border: "1px solid rgba(61,216,255,0.25)", color: "var(--noctra-cyan)" }}>
                Use standard flow context
              </button>
            </div>
          )}
      </div>

      <div className="flex gap-2">
        <NoctraButton onClick={run} disabled={phase === "running" || !input.trim()} className="flex-1">
          {phase === "running" ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
          {phase === "running" ? "Running sequence…" : "Run Launch Sequence"}
        </NoctraButton>
        {phase === "done" && <NoctraButton variant="ghost" onClick={reset}><RotateCcw size={13} /></NoctraButton>}
      </div>

    </div>
  );

  const OutputPanel = (
    phase === "idle" ? (
      <EmptyState icon={<Rocket size={22} />} title="Launch sequence not started" body="Describe your product and launch status. Get a go/no-go signal, gate analysis, and day-one action plan." />
    ) : phase === "running" ? (
      <div className="flex items-center justify-center h-40">
        <div className="text-center space-y-3">
          <Loader2 size={24} className="animate-spin mx-auto" style={{ color: TOOL.accent }} />
          <p className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>Running launch sequence…</p>
        </div>
      </div>
    ) : phase === "done" && result ? (
      <div className="space-y-4">
        {/* Go/No-Go signal */}
        {goNoGo && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: `${goColor}10`, border: `1px solid ${goColor}30` }}>
            <div>
              <p className="text-sm font-bold" style={{ color: goColor }}>
                {goNoGo === "GO" ? "🟢 GO" : goNoGo === "NO-GO" ? "🔴 NO-GO" : "🟡 HOLD"}
              </p>
              {d?.verdict != null && <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{String(d.verdict)}</p>}
            </div>
            {d?.launch_score != null && (
              <p className="text-2xl font-bold" style={{ color: goColor }}>{d.launch_score as number}</p>
            )}
          </div>
        )}

        <LaunchReportView report={{ payload: { data: result.data, markdown: result.markdown }, score: result.score ?? null }} />

        {saved && (
          <div className="flex gap-2 pt-1 border-t" style={{ borderColor: "var(--noctra-border)" }}>
            {savedReportId && (
              <NoctraButton variant="ghost" onClick={() => navigate(`/app/reports/${savedReportId}`)} className="flex-1">
                <ExternalLink size={12} /> View Full Report
              </NoctraButton>
            )}
            <NoctraButton variant="ghost" onClick={() => navigate("/app/twin")} className="flex-1">
              Next: Product Twin <ArrowRight size={12} />
            </NoctraButton>
          </div>
        )}

        {/* Launch checklist */}
        {launchChecklist.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Launch Checklist</p>
            <div className="space-y-1.5">
              {launchChecklist.slice(0, 8).map((item, i) => {
                const label = typeof item === "string" ? item : item.item;
                const done = typeof item === "string" ? false : item.done;
                return (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className="mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0" style={{ borderColor: done ? "var(--noctra-emerald)" : "var(--noctra-border)", background: done ? "rgba(16,185,129,0.15)" : "transparent" }}>
                      {done && <CheckCircle size={10} style={{ color: "var(--noctra-emerald)" }} />}
                    </div>
                    <span style={{ color: done ? "var(--noctra-text-muted)" : "var(--noctra-text)", textDecoration: done ? "line-through" : "none" }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    ) : null
  );

  return (
    <AppShell>
      <ToolScene
        icon={Rocket}
        label={TOOL.label}
        accent={TOOL.accent}
        phase={phase}
        inputPanel={InputPanel}
        outputPanel={OutputPanel}
        errorMessage={phase === "error" ? error : undefined}
      />
    </AppShell>
  );
}
