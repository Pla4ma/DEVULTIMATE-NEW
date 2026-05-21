import { useState, useEffect } from "react";
import { BreadcrumbBar } from "@/components/Breadcrumb";
import { Brain, RotateCcw, FolderOpen, AlertTriangle, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel, NoctraButton, Badge } from "@/components/Primitives";
import { callAI, callWithCrossContext } from "@/lib/ai";
import { TwinMemory } from "@/lib/twin-memory";
import { getProjects, getReports } from "@/lib/repository";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { detectContradictions, extractScoreTrends, type Contradiction } from "@/lib/intelligence";
import type { ReportSummary } from "@/lib/intelligence";
import { TwinChatPanel } from "./twin/TwinChatPanel";
import { TwinDataPanel } from "./twin/TwinDataPanel";
import type { Msg, Project } from "./twin/twin-types";
import { useToast } from "@/hooks/use-toast";

const TOOL = TOOL_BY_KEY["twin"]!;

const SYSTEM_PROMPT = `You are the Product Twin — the persistent memory of this project. You have deep context about product decisions, assumptions, experiments, and scores. Surface patterns, contradictions, blind spots, and next moves. Be direct and analytical. Reference specific tools and scores when available.`;

export default function TwinPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memCtx, setMemCtx] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [allReports, setAllReports] = useState<ReportSummary[]>([]);
  const [recentReports, setRecentReports] = useState<ReportSummary[]>([]);
  const [syntheticPhase, setSyntheticPhase] = useState<"idle" | "running" | "done">("idle");
  const [synthesis, setSynthesis] = useState<Record<string, unknown> | null>(null);
  const [synthesisStage, setSynthesisStage] = useState("");
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [toolsCovered, setToolsCovered] = useState<string[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    getProjects()
      .then((p) => { if (!cancelled) setProjects((p as Project[]) ?? []); })
      .catch(() => { if (!cancelled) { setProjects([]); toast({ title: "Failed to load projects", variant: "destructive" }); } });

    TwinMemory.loadMemoryContext().then((ctx) => {
      if (cancelled) return;
      const formatted = TwinMemory.formatMemoryForPrompt(ctx);
      setMemCtx(formatted);
      const reportsCount = ctx.passport.totalReports;
      const tasksCount = ctx.passport.openTasks;
      const avgScore = ctx.passport.averageScore;
      const coveredTools = new Set(ctx.latestReports.map((r) => String(r.tool ?? "")));
      const missingReports: string[] = [];
      if (!coveredTools.has("idea")) missingReports.push("Idea Checker");
      if (!coveredTools.has("doctor")) missingReports.push("Product Doctor");
      if (!coveredTools.has("mvp")) missingReports.push("MVP Planner");
      if (!coveredTools.has("swarm")) missingReports.push("Market Swarm");
      if (!coveredTools.has("reality")) missingReports.push("Reality Compiler");
      if (!coveredTools.has("launch")) missingReports.push("Launch Room");
      const parts: string[] = [];
      if (reportsCount > 0) {
        parts.push(`**Context loaded.** ${reportsCount} report${reportsCount !== 1 ? "s" : ""} available.`);
        if (avgScore > 0) parts.push(`Average score: **${avgScore.toFixed(0)}/100**.`);
        if (tasksCount > 0) parts.push(`${tasksCount} task${tasksCount !== 1 ? "s" : ""} in queue.`);
      } else {
        parts.push("**No reports yet.** Run Idea Checker or Product Doctor to start building context.");
      }
      if (missingReports.length > 0) {
        parts.push(`\nMissing context: ${missingReports.join(", ")}. Run these tools for deeper analysis.`);
      }
      if (ctx.passport.totalReports === 0 && missingReports.length > 0) {
        parts.push("\nI can answer general questions, but specific analysis requires running tools first.");
      }
      setMessages([{ role: "assistant", content: parts.join(" ") }]);
    }).catch(() => {
      if (!cancelled) {
        toast({ title: "Could not load project context", description: "Running with limited data.", variant: "destructive" });
        setMessages([{
          role: "assistant",
          content: "**No project data found.** Run Product Doctor or Idea Checker to start building context. I can answer general product questions in the meantime.",
        }]);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const query = selectedProjectId !== "all"
      ? getReports(undefined, selectedProjectId)
      : getReports();
    query
      .then((r) => {
        if (cancelled) return;
        const reps = ((r as ReportSummary[]) ?? []);
        setAllReports(reps);
        setRecentReports(reps.slice(0, 8));
        if (reps.length > 0) {
          setContradictions(detectContradictions(reps));
          setToolsCovered([...new Set(reps.map((r) => r.tool))]);
        } else {
          setToolsCovered([]);
        }
      })
      .catch(() => {
        if (!cancelled) { setAllReports([]); setRecentReports([]); setContradictions([]); toast({ title: "Failed to load reports", variant: "destructive" }); }
      });
    return () => { cancelled = true; };
  }, [selectedProjectId]);

  useEffect(() => {
    if (recentReports.length >= 2 && syntheticPhase === "idle" && !synthesis) {
      void runSynthesis();
    }
  }, [recentReports]);

  async function runSynthesis() {
    if (recentReports.length === 0) return;
    setSyntheticPhase("running");
    setSynthesisStage("Loading project context…");
    const reportSummary = recentReports
      .map((r) => `${r.tool}: "${r.title}" score=${r.score ?? "?"} — ${r.summary ?? "no summary"}`)
      .join("\n");
    try {
      const res = await callWithCrossContext("twin", `Synthesize these founder intelligence reports:\n\n${reportSummary}`, { onStage: setSynthesisStage, });
      setSynthesis(res.data);
      setSyntheticPhase("done");
    } catch (e) {
      console.warn("Synthesis failed (non-critical):", e);
      setSyntheticPhase("idle");
    }
  }

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    const reportCtx = recentReports.length > 0
      ? `\n\nRecent reports:\n${recentReports.map((r) => `- ${r.tool}: "${r.title}" (score: ${r.score ?? "N/A"}) — ${r.summary ?? ""}`).join("\n")}`
      : "";
    const synthesisCtx = synthesis ? `\n\nSynthesis: ${JSON.stringify(synthesis, null, 2)}` : "";
    const fullSystem = SYSTEM_PROMPT + (memCtx ? `\n\n${memCtx}` : "") + reportCtx + synthesisCtx;
    try {
      const reply = await callAI([...messages, userMsg].map((m) => ({ role: m.role, content: m.content })), fullSystem);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Analysis failed: ${e instanceof Error ? e.message : "Check your API configuration."}` }]);
    } finally {
      setLoading(false);
    }
  }

  function resetChat() {
    setMessages([{ role: "assistant", content: "Context cleared. What would you like to analyze?" }]);
    setSynthesis(null);
    setSyntheticPhase("idle");
  }

  const trends = extractScoreTrends(allReports);

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <BreadcrumbBar />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${TOOL.accent}18`, border: `1px solid ${TOOL.accent}30` }}>
            <Brain size={18} style={{ color: TOOL.accent }} />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold" style={{ color: "var(--noctra-text)" }}>{TOOL.label}</h1>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Ask about your project — patterns, blockers, and what to build next</p>
          </div>
          <NoctraButton variant="ghost" onClick={resetChat}><RotateCcw size={13} /> Reset</NoctraButton>
        </div>

        <Panel>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FolderOpen size={13} style={{ color: "var(--noctra-text-muted)" }} />
              <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Project context:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[{ id: "all", name: "All" }, ...projects].map((p) => (
                <button key={p.id} onClick={() => setSelectedProjectId(p.id)} className="px-3 py-1 rounded-full text-xs transition-all" style={{ background: selectedProjectId === p.id ? `${TOOL.accent}20` : "var(--noctra-surface2)", border: `1px solid ${selectedProjectId === p.id ? TOOL.accent : "var(--noctra-border)"}`, color: selectedProjectId === p.id ? TOOL.accent : "var(--noctra-text-muted)" }}>
                  {p.name}
                </button>
              ))}
            </div>
            {recentReports.length > 0 && (
              <span className="text-xs ml-auto shrink-0" style={{ color: "var(--noctra-text-muted)" }}>{recentReports.length} reports loaded</span>
            )}
          </div>
        </Panel>

        {contradictions.length > 0 && (
          <Panel>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={13} style={{ color: "var(--noctra-rose)" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-rose)" }}>
                Contradictions Detected ({contradictions.length})
              </p>
            </div>
            <div className="space-y-2.5">
              {contradictions.map((c, i) => (
                <div key={i} className="px-3 py-2.5 rounded-lg" style={{ background: c.severity === "high" ? "rgba(244,63,94,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${c.severity === "high" ? "rgba(244,63,94,0.2)" : "rgba(245,158,11,0.2)"}` }}>
                  <div className="flex items-start gap-2">
                    <Badge style={{ background: c.severity === "high" ? "rgba(244,63,94,0.15)" : "rgba(245,158,11,0.15)", color: c.severity === "high" ? "var(--noctra-rose)" : "var(--noctra-amber)", fontSize: "10px", flexShrink: 0 }}>{c.severity}</Badge>
                    <p className="text-xs" style={{ color: "var(--noctra-text)" }}>{c.description}</p>
                  </div>
                  <div className="flex items-start gap-1.5 mt-2 ml-1">
                    <ChevronRight size={10} style={{ color: "var(--noctra-emerald)", marginTop: 1, flexShrink: 0 }} />
                    <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{c.resolution}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TwinChatPanel messages={messages} loading={loading} input={input} setInput={setInput} onSend={send} />
          <TwinDataPanel recentReports={recentReports} allReports={allReports} toolsCovered={toolsCovered} syntheticPhase={syntheticPhase} synthesis={synthesis} synthesisStage={synthesisStage} trends={trends} onSynthesize={runSynthesis} />
        </div>
      </div>
    </AppShell>
  );
}
