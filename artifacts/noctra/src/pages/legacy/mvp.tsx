import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { ToolScene } from "@/components/ToolScene";
import { MvpReportView } from "@/components/reports/MvpReportView";
import { EmptyState, NoctraButton, Badge } from "@/components/Primitives";
import { callStructuredAI } from "@/lib/ai";
import { saveReport, saveTasks, getReports } from "@/lib/repository";
import { generateTasksFromReport } from "@/lib/task-generator";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { TOOL_EXAMPLES } from "@/lib/noctra-journey";
import { useProgression } from "@/lib/progression-context";
import { ListChecks, Wand2, Loader2, RotateCcw, CheckCircle, Download, FileDown, ExternalLink, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { reportToMarkdown, downloadMarkdown } from "@/lib/export";
import { ROUTES } from "@/lib/routes";

const TOOL = TOOL_BY_KEY["mvp"]!;
type Phase = "idle" | "running" | "done" | "error";

const TIMELINE_OPTIONS = ["4 weeks", "6 weeks", "8 weeks", "12 weeks"];
const STACK_OPTIONS = ["Next.js + Supabase", "React + Express", "SvelteKit + PlanetScale", "Remix + SQLite", "Vue + FastAPI", "Flutter Mobile", "React Native", "Custom / Other"];
const FOCUS_OPTIONS = ["Web app", "Mobile app", "API / Service", "Chrome extension", "CLI tool", "Desktop app"];

export default function MvpPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { refreshProgression } = useProgression();
  const [input, setInput] = useState("");
  const [timeline, setTimeline] = useState("4 weeks");
  const [stack, setStack] = useState("");
  const [focus, setFocus] = useState("Web app");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Awaited<ReturnType<typeof callStructuredAI>> | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [exportingTasks, setExportingTasks] = useState(false);
  const [tasksExported, setTasksExported] = useState(false);
  const [downloadingPrd, setDownloadingPrd] = useState(false);
  const [ideaContext, setIdeaContext] = useState<string | null>(null);
  const [realityContext, setRealityContext] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getReports("idea"), getReports("reality")]).then(([ideas, realities]) => {
      const idea = (ideas as Array<{ summary?: string | null }>)?.[0];
      const reality = (realities as Array<{ summary?: string | null }>)?.[0];
      if (idea) setIdeaContext(idea.summary ?? null);
      if (reality) setRealityContext(reality.summary ?? null);
    }).catch(() => { toast({ title: "Failed to load context", description: "Running without prior reports.", variant: "destructive" }); });
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (phase === "idle" && input.trim()) run();
    }
  }, [phase, input]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  async function run() {
    if (!input.trim()) return;
    setPhase("running"); setError(""); setResult(null); setSaved(false); setSavedReportId(null); setTasksExported(false);
    const context = {
      timeline,
      tech_stack: stack || undefined,
      product_type: focus,
    };
    try {
      const res = await callStructuredAI("mvp", input.trim(), context as Record<string, unknown>);
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
        tool: "mvp",
        title: res.title || `Blueprint — ${input.slice(0, 60)}`,
        payload: { data: res.data, markdown: res.markdown, timeline, stack, focus },
        score: res.score ?? undefined,
        summary: res.summary,
      });
      const r = report as { id?: string } | null;
      setSavedReportId(r?.id ?? null);
      if (r?.id) await generateTasksFromReport({ id: r.id, tool: "mvp", payload: { data: res.data }, project_id: null });
      setSaved(true);
      refreshProgression();
    } catch (e) {
      toast({ title: "Auto-save failed", description: e instanceof Error ? e.message : "Report results visible but not stored.", variant: "destructive" });
    }
  }

  function handleDownloadPrd() {
    if (!result) return;
    setDownloadingPrd(true);
    try {
      const md = reportToMarkdown({
        tool: "mvp",
        title: result.title || `Blueprint — ${input.slice(0, 60)}`,
        score: result.score ?? null,
        summary: result.summary ?? null,
        created_at: new Date().toISOString(),
        payload: { data: result.data, markdown: result.markdown },
      });
      downloadMarkdown(`blueprint-${input.slice(0, 40).replace(/\s+/g, "-").toLowerCase()}`, md);
    } finally {
      setDownloadingPrd(false);
    }
  }

  async function handleExportTasks() {
    if (!result?.data) return;
    setExportingTasks(true);
    try {
      const d = result.data as Record<string, unknown>;
      const weeks = Array.isArray(d.weeks) ? d.weeks as Array<{ week: string; goal: string; tasks: string[] }> : [];
      const allTasks = weeks.flatMap((w) =>
        (w.tasks ?? []).map((t: string) => ({
          title: t,
          detail: `${w.week}: ${w.goal}`,
          category: "development",
          priority: "medium",
        }))
      );
      if (allTasks.length > 0) {
        await saveTasks(allTasks);
        setTasksExported(true);
      }
    } catch (err) { toast({ title: "Failed to export tasks", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" }); } finally { setExportingTasks(false); }
  }

  function reset() {
    setPhase("idle"); setResult(null); setError(""); setSaved(false); setSavedReportId(null); setInput(""); setTasksExported(false);
  }

  const d = result?.data as Record<string, unknown> | null;
  const featureROI = Array.isArray(d?.feature_roi) ? d!.feature_roi as Array<{ feature: string; score: number; decision: string; reason?: string }> : [];

  const InputPanel = (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
          Describe your product
        </label>
        <textarea
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={TOOL_EXAMPLES.mvp?.[0] ?? "e.g. An async video review tool for design teams. Replaces Loom + comment threads with a single structured feedback loop."}
          rows={6} disabled={phase === "running"} maxLength={4000}
          className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
        />
        {input.length > 0 && (
          <div className="flex justify-end mt-1">
            <span className="text-[10px]" style={{ color: input.length > 3500 ? "var(--color-warning)" : "var(--text-tertiary)" }}>{input.length}/4000</span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>Build Timeline</label>
        <div className="flex gap-2 flex-wrap">
          {TIMELINE_OPTIONS.map((t) => (
            <button key={t} onClick={() => setTimeline(t)} disabled={phase === "running"} className="px-3 py-1.5 rounded-full text-xs font-medium transition-all" style={{ background: timeline === t ? `${TOOL.accent}20` : "var(--surface-2)", border: `1px solid ${timeline === t ? TOOL.accent : "var(--border-default)"}`, color: timeline === t ? TOOL.accent : "var(--text-tertiary)" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Product focus */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>Product Type</label>
        <div className="flex gap-1.5 flex-wrap">
          {FOCUS_OPTIONS.map((f) => (
            <button key={f} onClick={() => setFocus(f)} disabled={phase === "running"} className="px-2.5 py-1 rounded-full text-xs transition-all" style={{ background: focus === f ? `${TOOL.accent}20` : "var(--surface-2)", border: `1px solid ${focus === f ? TOOL.accent : "var(--border-default)"}`, color: focus === f ? TOOL.accent : "var(--text-tertiary)" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
          Tech Stack <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>(optional)</span>
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {STACK_OPTIONS.map((s) => (
            <button key={s} onClick={() => setStack(stack === s ? "" : s)} disabled={phase === "running"} className="px-2.5 py-1 rounded-full text-xs transition-all" style={{ background: stack === s ? `${TOOL.accent}20` : "var(--surface-2)", border: `1px solid ${stack === s ? TOOL.accent : "var(--border-default)"}`, color: stack === s ? TOOL.accent : "var(--text-tertiary)" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
                {ideaContext && phase === "idle" && !input.trim() && (
                  <NoctraButton variant="ghost" onClick={() => setInput(`Idea: ${ideaContext}`)}>
                    Use from Idea
                  </NoctraButton>
                )}
                {realityContext && phase === "idle" && !input.trim() && (
                  <NoctraButton variant="ghost" onClick={() => setInput(`Reality: ${realityContext}`)}>
                    Use from Reality
                  </NoctraButton>
                )}
        <NoctraButton onClick={run} disabled={phase === "running" || !input.trim()} className="flex-1">
          {phase === "running" ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
          {phase === "running" ? "Planning…" : "Plan MVP"}
        </NoctraButton>
        {phase === "idle" && <span className="flex items-center text-xs px-2" style={{ color: "var(--text-tertiary)" }}>⌘↵</span>}
        {phase === "done" && <NoctraButton variant="ghost" onClick={reset}><RotateCcw size={13} /></NoctraButton>}
      </div>

      {phase === "done" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <NoctraButton onClick={handleExportTasks} disabled={exportingTasks || tasksExported} className="flex-1" variant="ghost">
              {exportingTasks ? <Loader2 size={12} className="animate-spin" /> : tasksExported ? <CheckCircle size={12} style={{ color: "var(--color-success)" }} /> : <Download size={12} />}
              {tasksExported ? "Tasks Exported" : "Export to Tasks"}
            </NoctraButton>
            <NoctraButton onClick={handleDownloadPrd} disabled={downloadingPrd} className="flex-1" variant="ghost">
              {downloadingPrd ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
              Download PRD
            </NoctraButton>
          </div>
        </div>
      )}
    </div>
  );

  const OutputPanel = (
    phase === "idle" ? (
      <EmptyState icon={<ListChecks size={22} />} title="No blueprint yet" body="Describe your product and configure your build constraints." />
    ) : phase === "running" ? (
      <div className="flex items-center justify-center h-40">
        <div className="text-center space-y-3">
          <Loader2 size={24} className="animate-spin mx-auto" style={{ color: TOOL.accent }} />
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Building {timeline} blueprint…</p>
        </div>
      </div>
    ) : phase === "done" && result ? (
      <div className="space-y-4">
        <MvpReportView report={{ payload: { data: result.data, markdown: result.markdown }, score: result.score ?? null }} />
        {saved && (
          <div className="flex gap-2 pt-1 border-t" style={{ borderColor: "var(--border-default)" }}>
            {savedReportId && (
              <NoctraButton variant="ghost" onClick={() => navigate(ROUTES.reportDetail(savedReportId))} className="flex-1">
                <ExternalLink size={12} /> View Full Report
              </NoctraButton>
            )}
            <NoctraButton variant="ghost" onClick={() => navigate(ROUTES.doctor)} className="flex-1">
              Next: Project Doctor <ArrowRight size={12} />
            </NoctraButton>
          </div>
        )}
        {featureROI.length > 0 && (
          <div>
            <p className="eyebrow mb-2" style={{ color: "var(--text-tertiary)" }}>Feature ROI Scores</p>
            <div className="space-y-2">
              {featureROI.slice(0, 6).map((fr, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
                  <div className="flex-1">
                    <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{fr.feature}</p>
                    {fr.reason && <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{fr.reason}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full" style={{ background: "var(--surface-1)" }}>
                      <div className="h-full rounded-full" style={{ width: `${fr.score ?? 0}%`, background: fr.decision === "BUILD" ? "var(--color-success)" : fr.decision === "CUT" ? "var(--color-danger)" : "var(--color-warning)" }} />
                    </div>
                    <Badge style={{ fontSize: "10px", background: fr.decision === "BUILD" ? "var(--color-success-soft)" : fr.decision === "CUT" ? "var(--color-danger-soft)" : "var(--color-warning-soft)", color: fr.decision === "BUILD" ? "var(--color-success)" : fr.decision === "CUT" ? "var(--color-danger)" : "var(--color-warning)" }}>
                      {fr.decision}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ) : null
  );

  return (
    <AppShell>
      <ToolScene
        icon={ListChecks}
        label={TOOL.label}
        accent={TOOL.accent}
        phase={phase}
        description="Lock scope, define metrics, and generate a week-by-week build plan"
        inputPanel={InputPanel}
        outputPanel={OutputPanel}
        errorMessage={phase === "error" ? error : undefined}
      />
    </AppShell>
  );
}
