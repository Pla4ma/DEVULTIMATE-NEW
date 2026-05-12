import { useState, useEffect, useRef, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Panel, EmptyState, NoctraButton, Badge, ScoreRing } from "@/components/Primitives";
import { callAI, callWithCrossContext } from "@/lib/ai";
import type { StructuredResult } from "@/lib/ai";
import { TwinMemory } from "@/lib/twin-memory";
import { getProjects, getReports } from "@/lib/repository";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { detectContradictions, extractScoreTrends, type Contradiction } from "@/lib/intelligence";
import type { ReportSummary } from "@/lib/intelligence";
import { Brain, Send, Loader2, RotateCcw, Wand2, FolderOpen, AlertTriangle, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

const TOOL = TOOL_BY_KEY["twin"]!;

type Msg = { role: "user" | "assistant"; content: string };
type Project = { id: string; name: string; stage?: string | null };

const SYSTEM_PROMPT = `You are the Memory Constellation — the persistent digital twin of this founder. You have deep context about their product decisions, assumptions, experiments, and trajectory. Surface patterns, contradictions, strategic drift, and next moves. Be direct, analytical, and founder-grade honest. Reference specific tools and scores when available.`;

export default function TwinPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memCtx, setMemCtx] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [allReports, setAllReports] = useState<ReportSummary[]>([]);
  const [recentReports, setRecentReports] = useState<ReportSummary[]>([]);

  // Auto-synthesis state
  const [syntheticPhase, setSyntheticPhase] = useState<"idle" | "running" | "done">("idle");
  const [synthesis, setSynthesis] = useState<Record<string, unknown> | null>(null);
  const [synthesisStage, setSynthesisStage] = useState("");

  // Intelligence computed from reports
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Load memory and projects on mount
  useEffect(() => {
    getProjects()
      .then((p) => setProjects((p as Project[]) ?? []))
      .catch(() => setProjects([]));

    TwinMemory.loadMemoryContext().then((ctx) => {
      const formatted = TwinMemory.formatMemoryForPrompt(ctx);
      setMemCtx(formatted);
      const greeting = [
        `Memory constellation loaded. ${ctx.passport.totalReports} reports in intelligence vault.`,
        ctx.passport.averageScore > 0 ? ` Average score: ${ctx.passport.averageScore.toFixed(0)}/100.` : "",
        ctx.passport.openTasks > 0 ? ` ${ctx.passport.openTasks} tasks in the queue.` : "",
      ].join("");
      setMessages([{ role: "assistant", content: greeting }]);
    }).catch(() => {
      setMessages([{
        role: "assistant",
        content: "Memory constellation initialized. Run intelligence tools to build your founder context.",
      }]);
    });
  }, []);

  // Load reports when project context changes
  useEffect(() => {
    const query = selectedProjectId !== "all"
      ? getReports(undefined, selectedProjectId)
      : getReports();

    query
      .then((r) => {
        const reps = ((r as ReportSummary[]) ?? []);
        setAllReports(reps);
        setRecentReports(reps.slice(0, 8));
        if (reps.length > 0) {
          setContradictions(detectContradictions(reps));
        }
      })
      .catch(() => {
        setAllReports([]);
        setRecentReports([]);
        setContradictions([]);
      });
  }, [selectedProjectId]);

  // Auto-synthesize when we have enough reports
  useEffect(() => {
    if (recentReports.length >= 2 && syntheticPhase === "idle" && !synthesis) {
      void runSynthesis();
    }
  }, [recentReports]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function runSynthesis() {
    if (recentReports.length === 0) return;
    setSyntheticPhase("running");
    setSynthesisStage("Loading memory constellation…");

    const reportSummary = recentReports
      .map((r) => `${r.tool}: "${r.title}" score=${r.score ?? "?"} — ${r.summary ?? "no summary"}`)
      .join("\n");

    try {
      const res = await callWithCrossContext("twin", `Synthesize these founder intelligence reports:\n\n${reportSummary}`, {
        onStage: setSynthesisStage,
      });
      setSynthesis(res.data);
      setSyntheticPhase("done");
    } catch {
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

    const synthesisCtx = synthesis
      ? `\n\nSynthesis: ${JSON.stringify(synthesis, null, 2)}`
      : "";

    const fullSystem = SYSTEM_PROMPT + (memCtx ? `\n\n${memCtx}` : "") + reportCtx + synthesisCtx;

    try {
      const reply = await callAI(
        [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        fullSystem
      );
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Memory read failed. Check your API configuration." }]);
    } finally {
      setLoading(false);
    }
  }

  function resetChat() {
    setMessages([{ role: "assistant", content: "Memory cleared. What should I help you think through?" }]);
    setSynthesis(null);
    setSyntheticPhase("idle");
  }

  const trends = extractScoreTrends(allReports);
  const synth = synthesis as Record<string, unknown> | null;
  const patterns = Array.isArray(synth?.patterns)
    ? synth!.patterns as Array<{ pattern: string; evidence?: string; implication?: string } | string>
    : [];
  const driftSignals = Array.isArray(synth?.drift_signals)
    ? synth!.drift_signals as Array<{ signal?: string; severity?: string } | string>
    : [];
  const strategicMoves = Array.isArray(synth?.strategic_moves)
    ? synth!.strategic_moves as string[]
    : [];

  const trajectoryColor = {
    improving: "var(--noctra-emerald)",
    stagnant: "var(--noctra-amber)",
    declining: "var(--noctra-rose)",
  };

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${TOOL.accent}18`, border: `1px solid ${TOOL.accent}30` }}>
            <Brain size={18} style={{ color: TOOL.accent }} />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold" style={{ color: "var(--noctra-text)" }}>{TOOL.label}</h1>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Persistent founder intelligence — patterns, drift, and strategic moves</p>
          </div>
          <NoctraButton variant="ghost" onClick={resetChat}><RotateCcw size={13} /> Reset</NoctraButton>
        </div>

        {/* Project selector */}
        <Panel>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FolderOpen size={13} style={{ color: "var(--noctra-text-muted)" }} />
              <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Project context:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[{ id: "all", name: "All" }, ...projects].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className="px-3 py-1 rounded-full text-xs transition-all"
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
            {recentReports.length > 0 && (
              <span className="text-xs ml-auto shrink-0" style={{ color: "var(--noctra-text-muted)" }}>
                {recentReports.length} reports loaded
              </span>
            )}
            {recentReports.length >= 2 && syntheticPhase !== "running" && (
              <NoctraButton onClick={runSynthesis} disabled={false} variant="ghost">
                <Wand2 size={12} />
                {syntheticPhase === "done" ? "Re-synthesize" : "Synthesize"}
              </NoctraButton>
            )}
          </div>
        </Panel>

        {/* Contradictions — always show if detected */}
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
                <div key={i} className="px-3 py-2.5 rounded-lg" style={{
                  background: c.severity === "high" ? "rgba(244,63,94,0.06)" : "rgba(245,158,11,0.06)",
                  border: `1px solid ${c.severity === "high" ? "rgba(244,63,94,0.2)" : "rgba(245,158,11,0.2)"}`,
                }}>
                  <div className="flex items-start gap-2">
                    <Badge style={{
                      background: c.severity === "high" ? "rgba(244,63,94,0.15)" : "rgba(245,158,11,0.15)",
                      color: c.severity === "high" ? "var(--noctra-rose)" : "var(--noctra-amber)",
                      fontSize: "10px",
                      flexShrink: 0,
                    }}>{c.severity}</Badge>
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
          {/* Chat */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="flex flex-col gap-3 min-h-[400px] max-h-[500px] overflow-y-auto rounded-xl p-4" style={{ background: "var(--noctra-surface)", border: "1px solid var(--noctra-border)" }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[85%] px-3 py-2.5 rounded-xl text-sm whitespace-pre-wrap"
                    style={{
                      background: msg.role === "user" ? `${TOOL.accent}20` : "var(--noctra-surface2)",
                      border: `1px solid ${msg.role === "user" ? `${TOOL.accent}30` : "var(--noctra-border)"}`,
                      color: "var(--noctra-text)",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2.5 rounded-xl" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                    <Loader2 size={14} className="animate-spin" style={{ color: TOOL.accent }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), void send())}
                placeholder="Ask about patterns, contradictions, next moves…"
                disabled={loading}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: "var(--noctra-surface)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
              />
              <NoctraButton onClick={send} disabled={loading || !input.trim()}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </NoctraButton>
            </div>
          </div>

          {/* Synthesis + Score panel */}
          <div className="space-y-3">
            {/* Score trends */}
            {trends.length > 0 && (
              <Panel>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Score Trends</p>
                <div className="space-y-2">
                  {trends.slice(0, 5).map((t) => {
                    const tool = TOOL_BY_KEY[t.tool as keyof typeof TOOL_BY_KEY];
                    const deltaColor = t.direction === "up" ? "var(--noctra-emerald)" : t.direction === "down" ? "var(--noctra-rose)" : "var(--noctra-text-muted)";
                    return (
                      <div key={t.tool} className="flex items-center gap-2">
                        <span className="text-xs w-16 truncate shrink-0" style={{ color: "var(--noctra-text-muted)" }}>{t.label.split(" ")[0]}</span>
                        <div className="flex-1 h-1 rounded-full" style={{ background: "var(--noctra-surface2)" }}>
                          <div className="h-1 rounded-full transition-all" style={{ width: `${t.latestScore}%`, background: tool?.accent ?? "var(--noctra-cyan)" }} />
                        </div>
                        <span className="text-xs font-mono w-6 text-right shrink-0" style={{ color: tool?.accent ?? "var(--noctra-cyan)" }}>{t.latestScore}</span>
                        {t.delta != null && (
                          <span style={{ color: deltaColor }}>
                            {t.direction === "up" ? <TrendingUp size={9} /> : t.direction === "down" ? <TrendingDown size={9} /> : <Minus size={9} />}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* Synthesis loading */}
            {syntheticPhase === "running" && (
              <Panel>
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <Loader2 size={18} className="animate-spin" style={{ color: TOOL.accent }} />
                  <p className="text-xs text-center" style={{ color: "var(--noctra-text-muted)" }}>
                    {synthesisStage || "Synthesizing…"}
                  </p>
                </div>
              </Panel>
            )}

            {/* Synthesis empty */}
            {syntheticPhase === "idle" && recentReports.length < 2 && (
              <Panel>
                <EmptyState
                  icon={<Wand2 size={18} />}
                  title="Not enough data"
                  body="Run at least 2 intelligence tools to unlock synthesis."
                />
              </Panel>
            )}

            {/* Synthesis done */}
            {syntheticPhase === "done" && synth && (
              <>
                {synth.overall_trajectory != null && (
                  <Panel>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Trajectory</p>
                    <Badge style={{
                      background: `${trajectoryColor[synth.overall_trajectory as keyof typeof trajectoryColor] ?? "var(--noctra-amber)"}18`,
                      color: trajectoryColor[synth.overall_trajectory as keyof typeof trajectoryColor] ?? "var(--noctra-amber)",
                    }}>
                      {String(synth.overall_trajectory)}
                    </Badge>
                    {Boolean(synth.summary) && (
                      <p className="text-xs mt-2" style={{ color: "var(--noctra-text-muted)" }}>{String(synth.summary)}</p>
                    )}
                  </Panel>
                )}

                {patterns.length > 0 && (
                  <Panel>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Patterns</p>
                    <div className="space-y-2">
                      {patterns.slice(0, 3).map((p, i) => (
                        <div key={i} className="px-3 py-2 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                          <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>
                            {typeof p === "string" ? p : p.pattern}
                          </p>
                          {typeof p !== "string" && p.implication && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{p.implication}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}

                {driftSignals.length > 0 && (
                  <Panel>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-rose)" }}>Drift Signals</p>
                    <div className="space-y-1.5">
                      {driftSignals.slice(0, 3).map((d, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <AlertTriangle size={10} style={{ color: "var(--noctra-rose)", marginTop: 1, flexShrink: 0 }} />
                          <span style={{ color: "var(--noctra-text-muted)" }}>
                            {typeof d === "string" ? d : (d.signal ?? "")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}

                {strategicMoves.length > 0 && (
                  <Panel>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-cyan)" }}>Strategic Moves</p>
                    <div className="space-y-1.5">
                      {strategicMoves.slice(0, 3).map((m, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs">
                          <ChevronRight size={10} style={{ color: "var(--noctra-cyan)", marginTop: 1, flexShrink: 0 }} />
                          <span style={{ color: "var(--noctra-text)" }}>{m}</span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
