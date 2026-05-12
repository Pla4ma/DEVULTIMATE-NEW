import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ToolScene } from "@/components/ToolScene";
import { MvpReportView } from "@/components/reports/MvpReportView";
import { EmptyState, NoctraButton, Badge } from "@/components/Primitives";
import { callStructuredAI } from "@/lib/ai";
import { saveReport, saveTasks } from "@/lib/repository";
import { generateTasksFromReport } from "@/lib/task-generator";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { TOOL_EXAMPLES } from "@/lib/noctra-journey";
import { ListChecks, Wand2, Loader2, RotateCcw, Save, CheckCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TOOL = TOOL_BY_KEY["mvp"]!;
type Phase = "idle" | "running" | "done" | "error";

const TIMELINE_OPTIONS = ["4 weeks", "6 weeks", "8 weeks", "12 weeks"];
const STACK_OPTIONS = ["Next.js + Supabase", "React + Express", "SvelteKit + PlanetScale", "Remix + SQLite", "Vue + FastAPI", "Flutter Mobile", "React Native", "Custom / Other"];
const FOCUS_OPTIONS = ["Web app", "Mobile app", "API / Service", "Chrome extension", "CLI tool", "Desktop app"];

export default function MvpPage() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [timeline, setTimeline] = useState("4 weeks");
  const [stack, setStack] = useState("");
  const [focus, setFocus] = useState("Web app");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Awaited<ReturnType<typeof callStructuredAI>> | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportingTasks, setExportingTasks] = useState(false);
  const [tasksExported, setTasksExported] = useState(false);

  async function run() {
    if (!input.trim()) return;
    setPhase("running"); setError(""); setResult(null); setSaved(false); setTasksExported(false);
    const context = {
      timeline,
      tech_stack: stack || undefined,
      product_type: focus,
    };
    try {
      const res = await callStructuredAI("mvp", input.trim(), context as Record<string, unknown>);
      setResult(res);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setPhase("error");
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      const report = await saveReport({
        tool: "mvp",
        title: result.title || `Blueprint — ${input.slice(0, 60)}`,
        payload: { data: result.data, markdown: result.markdown, timeline, stack, focus },
        score: result.score ?? undefined,
        summary: result.summary,
      });
      if (report) await generateTasksFromReport({ id: report.id, tool: "mvp", payload: { data: result.data }, project_id: null });
      setSaved(true);
    } catch (err) { toast({ title: "Failed to save report", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" }); } finally { setSaving(false); }
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
    setPhase("idle"); setResult(null); setError(""); setSaved(false); setInput(""); setTasksExported(false);
  }

  const d = result?.data as Record<string, unknown> | null;
  const featureROI = Array.isArray(d?.feature_roi) ? d!.feature_roi as Array<{ feature: string; score: number; decision: string; reason?: string }> : [];

  const InputPanel = (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>
          Describe your product
        </label>
        <textarea
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={TOOL_EXAMPLES.mvp?.[0] ?? "e.g. An async video review tool for design teams. Replaces Loom + comment threads with a single structured feedback loop."}
          rows={6} disabled={phase === "running"}
          className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none"
          style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
        />
      </div>

      {/* Timeline */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>Build Timeline</label>
        <div className="flex gap-2 flex-wrap">
          {TIMELINE_OPTIONS.map((t) => (
            <button key={t} onClick={() => setTimeline(t)} disabled={phase === "running"} className="px-3 py-1.5 rounded-full text-xs font-medium transition-all" style={{ background: timeline === t ? `${TOOL.accent}20` : "var(--noctra-surface2)", border: `1px solid ${timeline === t ? TOOL.accent : "var(--noctra-border)"}`, color: timeline === t ? TOOL.accent : "var(--noctra-text-muted)" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Product focus */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>Product Type</label>
        <div className="flex gap-1.5 flex-wrap">
          {FOCUS_OPTIONS.map((f) => (
            <button key={f} onClick={() => setFocus(f)} disabled={phase === "running"} className="px-2.5 py-1 rounded-full text-xs transition-all" style={{ background: focus === f ? `${TOOL.accent}20` : "var(--noctra-surface2)", border: `1px solid ${focus === f ? TOOL.accent : "var(--noctra-border)"}`, color: focus === f ? TOOL.accent : "var(--noctra-text-muted)" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>
          Tech Stack <span style={{ fontWeight: 400, color: "var(--noctra-text-muted)" }}>(optional)</span>
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {STACK_OPTIONS.map((s) => (
            <button key={s} onClick={() => setStack(stack === s ? "" : s)} disabled={phase === "running"} className="px-2.5 py-1 rounded-full text-xs transition-all" style={{ background: stack === s ? `${TOOL.accent}20` : "var(--noctra-surface2)", border: `1px solid ${stack === s ? TOOL.accent : "var(--noctra-border)"}`, color: stack === s ? TOOL.accent : "var(--noctra-text-muted)" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <NoctraButton onClick={run} disabled={phase === "running" || !input.trim()} className="flex-1">
          {phase === "running" ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
          {phase === "running" ? "Planning…" : "Plan MVP"}
        </NoctraButton>
        {phase === "done" && <NoctraButton variant="ghost" onClick={reset}><RotateCcw size={13} /></NoctraButton>}
      </div>

      {phase === "done" && (
        <div className="flex gap-2">
          <NoctraButton onClick={handleSave} disabled={saving || saved} className="flex-1" variant="ghost">
            {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <CheckCircle size={12} style={{ color: "var(--noctra-emerald)" }} /> : <Save size={12} />}
            {saved ? "Saved" : "Save Report"}
          </NoctraButton>
          <NoctraButton onClick={handleExportTasks} disabled={exportingTasks || tasksExported} className="flex-1" variant="ghost">
            {exportingTasks ? <Loader2 size={12} className="animate-spin" /> : tasksExported ? <CheckCircle size={12} style={{ color: "var(--noctra-emerald)" }} /> : <Download size={12} />}
            {tasksExported ? "Tasks Exported" : "Export to Tasks"}
          </NoctraButton>
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
          <p className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>Building {timeline} blueprint…</p>
        </div>
      </div>
    ) : phase === "done" && result ? (
      <div className="space-y-4">
        <MvpReportView report={{ payload: { data: result.data, markdown: result.markdown }, score: result.score ?? null }} />
        {featureROI.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Feature ROI Scores</p>
            <div className="space-y-2">
              {featureROI.slice(0, 6).map((fr, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                  <div className="flex-1">
                    <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{fr.feature}</p>
                    {fr.reason && <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{fr.reason}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full" style={{ background: "var(--noctra-surface)" }}>
                      <div className="h-full rounded-full" style={{ width: `${fr.score ?? 0}%`, background: fr.decision === "BUILD" ? "var(--noctra-emerald)" : fr.decision === "CUT" ? "var(--noctra-rose)" : "var(--noctra-amber)" }} />
                    </div>
                    <Badge style={{ fontSize: "10px", background: fr.decision === "BUILD" ? "rgba(16,185,129,0.15)" : fr.decision === "CUT" ? "rgba(244,63,94,0.15)" : "rgba(245,158,11,0.15)", color: fr.decision === "BUILD" ? "var(--noctra-emerald)" : fr.decision === "CUT" ? "var(--noctra-rose)" : "var(--noctra-amber)" }}>
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
        inputPanel={InputPanel}
        outputPanel={OutputPanel}
        errorMessage={phase === "error" ? error : undefined}
      />
    </AppShell>
  );
}
