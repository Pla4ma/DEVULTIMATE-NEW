import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { callAI, callWithCrossContext } from "@/lib/ai";
import { TwinMemory } from "@/lib/twin-memory";
import { getProjects, getReports, getTasks, getProofSignals } from "@/lib/repository";
import { useProgression } from "@/lib/progression-context";
import { useToast } from "@/hooks/use-toast";
import { extractScoreTrends } from "@/lib/intelligence";
import type { ReportSummary } from "@/lib/report-utils";
import { runContradictionEngine, type EnhancedContradiction } from "@/lib/contradiction-engine";
import { ObsidianButton } from "@/components/ObsidianButton";
import {
  Brain, FolderOpen, FileText, BarChart3, Send, Loader2, RotateCcw,
  CheckCircle, AlertTriangle, ArrowRight, TrendingUp, TrendingDown,
  Minus, Clock, Zap, ChevronRight, ExternalLink,
} from "lucide-react";

type TabMode = "chat" | "projects" | "reports" | "profile";
type Msg = { role: "user" | "assistant"; content: string };

const TABS: Array<{ key: TabMode; label: string; icon: typeof Brain; color: string }> = [
  { key: "chat", label: "AI Chat", icon: Brain, color: "var(--accent-magenta)" },
  { key: "projects", label: "Projects", icon: FolderOpen, color: "var(--accent-cyan)" },
  { key: "reports", label: "Reports", icon: FileText, color: "var(--accent-violet)" },
  { key: "profile", label: "Profile", icon: BarChart3, color: "var(--accent-gold)" },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const SYSTEM_PROMPT = `You are the Product Brain — the persistent memory of this project. You have deep context about product decisions, assumptions, experiments, and scores. Surface patterns, contradictions, blind spots, and next moves. Be direct and analytical. Reference specific tools and scores when available.`;

export default function ProjectBrainPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { refreshProgression } = useProgression();

  const [tab, setTab] = useState<TabMode>("chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memCtx, setMemCtx] = useState("");
  const [projects, setProjects] = useState<Array<{ id: string; name: string; stage?: string | null }>>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [allReports, setAllReports] = useState<ReportSummary[]>([]);
  const [recentReports, setRecentReports] = useState<ReportSummary[]>([]);
  const [contradictions, setContradictions] = useState<EnhancedContradiction[]>([]);
  const [toolsCovered, setToolsCovered] = useState<string[]>([]);
  const [allTasks, setAllTasks] = useState<Array<{ id: string; status: string; priority: string; title?: string }>>([]);
  const [allSignals, setAllSignals] = useState<Array<{ id: string; kind?: string; label?: string }>>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getProjects(), getTasks(), getProofSignals()])
      .then(([p, t, s]) => {
        if (cancelled) return;
        setProjects(p ?? []);
        setAllTasks(t ?? []);
        setAllSignals(s ?? []);
      })
      .catch(() => { toast({ title: "Failed to load data", variant: "destructive" }); })
      .finally(() => { if (!cancelled) setLoadingData(false); });

    TwinMemory.loadMemoryContext().then((ctx) => {
      if (cancelled) return;
      const formatted = TwinMemory.formatMemoryForPrompt(ctx);
      setMemCtx(formatted);
      const reportsCount = ctx.passport.totalReports;
      const tasksCount = ctx.passport.openTasks;
      const avgScore = ctx.passport.averageScore;
      const parts: string[] = [];
      if (reportsCount > 0) {
        parts.push(`**Context loaded.** ${reportsCount} report${reportsCount !== 1 ? "s" : ""} available.`);
        if (avgScore > 0) parts.push(`Average score: **${avgScore.toFixed(0)}/100**.`);
        if (tasksCount > 0) parts.push(`${tasksCount} task${tasksCount !== 1 ? "s" : ""} in queue.`);
        if (reportsCount > 0) {
          const demoThread: Msg[] = [
            { role: "assistant", content: parts.join(" ") },
            { role: "user", content: "What's blocking launch right now?" },
            { role: "assistant", content: "**One RED gate is blocking launch: auth rate limiting.** Your login and signup endpoints accept unlimited requests per IP — that's a credential-stuffing vector. Everything else is green or yellow.\n\nYour launch readiness score is **72/100** (up from 34 six weeks ago). The fix is a sliding-window limiter on auth routes — estimated 2–4 hours. Once that ships, you're at ~85 and in GO territory.\n\nSecondary: test coverage is YELLOW. The review pipeline has no end-to-end test. Not a blocker, but worth fixing before you onboard design partners." },
          ];
          setMessages(demoThread);
          return;
        }
      } else {
        parts.push("**No reports yet.** Run Idea Checker or Product Doctor to start building context.");
      }
      setMessages([{ role: "assistant", content: parts.join(" ") }]);
    }).catch(() => {
      if (!cancelled) {
        setMessages([{ role: "assistant", content: "**No project data found.** Run Product Doctor or Idea Checker to start building context." }]);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const query = selectedProjectId !== "all" ? getReports(undefined, selectedProjectId) : getReports();
    query.then((r) => {
      if (cancelled) return;
      const reps = ((r as ReportSummary[]) ?? []);
      setAllReports(reps);
      setRecentReports(reps.slice(0, 8));
      if (reps.length > 0) {
        setContradictions(runContradictionEngine(reps).contradictions);
        setToolsCovered([...new Set(reps.map((r) => r.tool))]);
      } else {
        setToolsCovered([]);
      }
    }).catch(() => { if (!cancelled) { setAllReports([]); setRecentReports([]); setContradictions([]); } });
    return () => { cancelled = true; };
  }, [selectedProjectId]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    const reportCtx = recentReports.length > 0 ? `\n\nRecent reports:\n${recentReports.map((r) => `- ${r.tool}: "${r.title}" (score: ${r.score ?? "N/A"}) — ${r.summary ?? ""}`).join("\n")}` : "";
    const fullSystem = SYSTEM_PROMPT + (memCtx ? `\n\n${memCtx}` : "") + reportCtx;
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
  }

  const trends = extractScoreTrends(allReports);
  const completedTasks = allTasks.filter((t) => t.status === "completed").length;
  const avgScore = allReports.length ? Math.round(allReports.reduce((s, r) => s + (typeof r.score === "number" ? r.score : 0), 0) / allReports.length) : 0;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <motion.div {...fadeInUp} className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-display" style={{ color: "#fff" }}>Project Brain</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Your persistent product memory — AI chat, project intelligence, and reports</p>
        </motion.div>

        <motion.div {...fadeInUp} className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background: active ? `rgba(249, 115, 22, 0.12)` : "rgba(20, 18, 40, 0.5)",
                  border: `1px solid ${active ? "rgba(249, 115, 22, 0.12)" : "rgba(139, 92, 246, 0.12)"}`,
                  color: active ? "#f97316" : "rgba(255,255,255,0.6)",
                }}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </motion.div>

        {tab === "chat" && (
          <motion.div {...fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass overflow-hidden flex flex-col" style={{ height: 520 }}>
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "rgba(139, 92, 246, 0.12)", background: "rgba(20, 18, 40, 0.5)", backdropFilter: "blur(12px)" }}>
                <Brain size={14} style={{ color: "#f97316" }} />
                <p className="eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>Product Twin</p>
                <span className="ml-auto text-mono text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{allReports.length} reports loaded</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"}`}
                      style={{
                        background: msg.role === "user" ? "#f97316" : "rgba(20, 18, 40, 0.5)", backdropFilter: msg.role === "user" ? undefined : "blur(12px)",
                        color: msg.role === "user" ? "#fff" : "rgba(255,255,255,0.6)",
                        border: msg.role === "user" ? "none" : "1px solid rgba(139, 92, 246, 0.12)",
                      }}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-xl px-4 py-3 rounded-bl-sm" style={{ background: "rgba(20, 18, 40, 0.5)", border: "1px solid rgba(139, 92, 246, 0.12)", backdropFilter: "blur(12px)" }}>
                      <Loader2 size={16} className="animate-spin" style={{ color: "#f97316" }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t" style={{ borderColor: "rgba(139, 92, 246, 0.12)" }}>
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                    placeholder="Ask about your project..."
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: "rgba(20, 18, 40, 0.5)", border: "1px solid rgba(139, 92, 246, 0.12)", color: "#fff" }}
                  />
                  <ObsidianButton variant="primary" onClick={send} disabled={loading || !input.trim()}>
                    <Send size={16} />
                  </ObsidianButton>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {contradictions.length > 0 && (
                <div className="glass p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} style={{ color: "var(--color-danger)" }} />
                    <p className="eyebrow" style={{ color: "var(--color-danger)" }}>Contradictions ({contradictions.length})</p>
                  </div>
                  <div className="space-y-2">
                    {contradictions.slice(0, 3).map((c, i) => (
                      <div key={i} className="text-xs p-2 rounded-lg" style={{ background: "rgba(20, 18, 40, 0.5)", backdropFilter: "blur(12px)" }}>
                        <p style={{ color: "rgba(255,255,255,0.6)" }}>{c.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass p-4">
                <p className="eyebrow mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Quick Stats</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Reports</span>
                    <span style={{ color: "#fff" }}>{allReports.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Avg Score</span>
                    <span style={{ color: avgScore >= 70 ? "var(--color-success)" : avgScore >= 40 ? "var(--color-warning)" : "var(--color-danger)" }}>{avgScore}/100</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Tasks Done</span>
                    <span style={{ color: "#fff" }}>{completedTasks}/{allTasks.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Tools Used</span>
                    <span style={{ color: "#fff" }}>{toolsCovered.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {tab === "projects" && (
          <motion.div {...fadeInUp} className="space-y-4">
            {projects.length === 0 ? (
              <div className="text-center py-16">
                <FolderOpen size={32} className="mx-auto mb-4" style={{ color: "rgba(255,255,255,0.5)" }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>No projects yet</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Projects are created automatically when you run tools</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    whileHover={{ y: -2 }}
                    className="glass p-5 cursor-pointer transition-colors"
                    onClick={() => navigate(`/app/projects/${project.id}`)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <FolderOpen size={18} style={{ color: "#f97316" }} />
                      <p className="text-sm font-semibold truncate" style={{ color: "#fff" }}>{project.name}</p>
                    </div>
                    {project.stage && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(249, 115, 22, 0.12)", color: "#f97316" }}>
                        {project.stage}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "reports" && (
          <motion.div {...fadeInUp} className="space-y-4">
            {allReports.length === 0 ? (
              <div className="text-center py-16">
                <FileText size={32} className="mx-auto mb-4" style={{ color: "rgba(255,255,255,0.5)" }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>No reports yet</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Run tools to generate reports</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allReports.slice(0, 20).map((report) => (
                  <motion.div
                    key={report.id}
                    whileHover={{ x: 2 }}
                    className="glass p-4 cursor-pointer transition-colors flex items-center gap-4"
                    onClick={() => navigate(`/app/reports/${report.id}`)}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(20, 18, 40, 0.5)", backdropFilter: "blur(12px)" }}>
                      <FileText size={18} style={{ color: "#f97316" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#fff" }}>{report.title}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{report.tool} · {new Date(report.created_at).toLocaleDateString()}</p>
                    </div>
                    {report.score != null && (
                      <span className="text-sm font-bold" style={{ color: report.score >= 70 ? "var(--color-success)" : report.score >= 40 ? "var(--color-warning)" : "var(--color-danger)" }}>
                        {report.score}
                      </span>
                    )}
                    <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "profile" && (
          <motion.div {...fadeInUp} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Avg Score", value: avgScore, suffix: "/100", color: avgScore >= 70 ? "var(--color-success)" : avgScore >= 40 ? "var(--color-warning)" : "var(--color-danger)" },
                { label: "Tasks Done", value: completedTasks, suffix: `/${allTasks.length}`, color: "var(--color-success)" },
                { label: "Reports", value: allReports.length, suffix: "", color: "#f97316" },
              ].map((stat) => (
                <div key={stat.label} className="glass p-5">
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{stat.label}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}<span className="text-sm font-normal" style={{ color: "rgba(255,255,255,0.5)" }}>{stat.suffix}</span></p>
                </div>
              ))}
            </div>

            {toolsCovered.length > 0 && (
              <div className="glass p-5">
                <p className="eyebrow mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>Tools Used</p>
                <div className="flex flex-wrap gap-2">
                  {toolsCovered.map((tool) => (
                    <span key={tool} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(20, 18, 40, 0.5)", color: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)" }}>
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
