import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { ToolScene } from "@/components/ToolScene";
import { SwarmReportView } from "@/components/reports/SwarmReportView";
import { EmptyState, NoctraButton, Badge } from "@/components/Primitives";
import { callStructuredAI } from "@/lib/ai";
import { saveReport } from "@/lib/repository";
import { generateTasksFromReport } from "@/lib/task-generator";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { TOOL_EXAMPLES } from "@/lib/noctra-journey";
import { useProgression } from "@/lib/progression-context";
import { Users, Wand2, Loader2, RotateCcw, CheckCircle, ExternalLink, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TOOL = TOOL_BY_KEY["swarm"]!;
type Phase = "idle" | "running" | "done" | "error";

const PERSONA_COUNTS = [10, 25, 50, 100] as const;
const MARKET_SEGMENTS = [
  "B2B SaaS", "B2C Consumer", "Developer Tools", "Enterprise", "SMB",
  "E-commerce", "Fintech", "Health Tech", "EdTech", "Marketplace", "Other",
];
const PRICE_RANGES = [
  "Free tier only", "$1–$10/mo", "$10–$50/mo", "$50–$200/mo",
  "$200–$1000/mo", "$1000+/mo", "One-time purchase", "Usage-based",
];

export default function SwarmPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { refreshProgression } = useProgression();
  const [input, setInput] = useState("");
  const [customPersonas, setCustomPersonas] = useState("");
  const [personaCount, setPersonaCount] = useState<typeof PERSONA_COUNTS[number]>(25);
  const [segment, setSegment] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Awaited<ReturnType<typeof callStructuredAI>> | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);

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
    setPhase("running"); setError(""); setResult(null); setSaved(false); setSavedReportId(null);

    const parts = [input.trim()];
    if (segment) parts.push(`Target segment: ${segment}`);
    if (priceRange) parts.push(`Expected price range: ${priceRange}`);
    if (customPersonas.trim()) parts.push(`Specific personas to include: ${customPersonas.trim()}`);

    const fullInput = parts.join("\n\n");
    const context = {
      persona_count: personaCount,
      simulation_size: `${personaCount} distinct user personas`,
      segment: segment || undefined,
      price_range: priceRange || undefined,
    };

    try {
      const res = await callStructuredAI("swarm", fullInput, context as Record<string, unknown>);
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
        tool: "swarm",
        title: res.title || `Market Swarm — ${input.slice(0, 60)}`,
        payload: { data: res.data, markdown: res.markdown, personaCount, segment, priceRange },
        score: res.score ?? undefined,
        summary: res.summary,
      });
      const r = report as { id?: string } | null;
      setSavedReportId(r?.id ?? null);
      if (r?.id) await generateTasksFromReport({ id: r.id, tool: "swarm", payload: { data: res.data }, project_id: null });
      setSaved(true);
      refreshProgression();
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Could not auto-save report.", variant: "destructive" });
    }
  }

  function reset() {
    setPhase("idle"); setResult(null); setError(""); setSaved(false); setSavedReportId(null);
    setInput(""); setCustomPersonas(""); setSegment(""); setPriceRange("");
  }

  const InputPanel = (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>Your offer or pitch</label>
        <textarea
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={TOOL_EXAMPLES.swarm?.[0] ?? "Describe your offer, pitch, or product…"}
          rows={5} disabled={phase === "running"} maxLength={4000}
          className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none"
          style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
        />
        {input.length > 0 && (
          <div className="flex justify-end mt-1">
            <span className="text-[10px]" style={{ color: input.length > 3500 ? "var(--noctra-amber)" : "var(--noctra-text-muted)" }}>{input.length}/4000</span>
          </div>
        )}
      </div>

      {/* Persona count selector */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>Simulation depth</label>
        <div className="flex gap-2">
          {PERSONA_COUNTS.map((count) => (
            <button
              key={count}
              onClick={() => setPersonaCount(count)}
              disabled={phase === "running"}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: personaCount === count ? `${TOOL.accent}20` : "var(--noctra-surface2)",
                border: `1px solid ${personaCount === count ? TOOL.accent : "var(--noctra-border)"}`,
                color: personaCount === count ? TOOL.accent : "var(--noctra-text-muted)",
              }}
            >
              {count}
            </button>
          ))}
        </div>
        <p className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>
          {/* Simulates {personaCount} distinct user personas reacting to your pitch */}
          {personaCount}-user market signal simulation
        </p>
      </div>

      {/* Market segment */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>Target Market Segment</label>
        <div className="flex flex-wrap gap-1.5">
          {MARKET_SEGMENTS.map((seg) => (
            <button
              key={seg}
              onClick={() => setSegment(segment === seg ? "" : seg)}
              disabled={phase === "running"}
              className="px-2.5 py-1 rounded-full text-xs transition-all"
              style={{
                background: segment === seg ? `${TOOL.accent}20` : "var(--noctra-surface2)",
                border: `1px solid ${segment === seg ? TOOL.accent : "var(--noctra-border)"}`,
                color: segment === seg ? TOOL.accent : "var(--noctra-text-muted)",
              }}
            >
              {seg}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>Expected Price Range</label>
        <div className="flex flex-wrap gap-1.5">
          {PRICE_RANGES.map((pr) => (
            <button
              key={pr}
              onClick={() => setPriceRange(priceRange === pr ? "" : pr)}
              disabled={phase === "running"}
              className="px-2.5 py-1 rounded-full text-xs transition-all"
              style={{
                background: priceRange === pr ? `${TOOL.accent}20` : "var(--noctra-surface2)",
                border: `1px solid ${priceRange === pr ? TOOL.accent : "var(--noctra-border)"}`,
                color: priceRange === pr ? TOOL.accent : "var(--noctra-text-muted)",
              }}
            >
              {pr}
            </button>
          ))}
        </div>
      </div>

      {/* Custom personas */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>
          Specific Personas to Include <span style={{ color: "var(--noctra-text-muted)", fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          value={customPersonas}
          onChange={(e) => setCustomPersonas(e.target.value)}
          placeholder="e.g. Skeptical CTO, budget-conscious startup founder, enterprise buyer"
          disabled={phase === "running"}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
        />
      </div>

      <div className="flex gap-2">
        <NoctraButton onClick={run} disabled={phase === "running" || !input.trim()} className="flex-1">
          {phase === "running" ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
          {phase === "running" ? `Analyzing ${personaCount} market signals…` : `Run ${personaCount}-Persona Market Swarm`}
        </NoctraButton>
        {phase === "idle" && <span className="flex items-center text-xs px-2" style={{ color: "var(--noctra-text-muted)" }}>⌘↵</span>}
        {phase === "done" && <NoctraButton variant="ghost" onClick={reset}><RotateCcw size={13} /></NoctraButton>}
      </div>
    </div>
  );

  const OutputPanel = (
    phase === "idle" ? (
      <EmptyState icon={<Users size={22} />} title="Swarm not deployed" body={`Configure market parameters and deploy a ${personaCount}-persona market signal simulation.`} />
    ) : phase === "running" ? (
      <div className="flex items-center justify-center h-40">
        <div className="text-center space-y-3">
          <Loader2 size={24} className="animate-spin mx-auto" style={{ color: TOOL.accent }} />
          <p className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>Running {personaCount}-user market signal simulation…</p>
        </div>
      </div>
    ) : phase === "done" && result ? (
      <div className="space-y-4">
        {/* Segment breakdown if available */}
        {result.data && typeof result.data === "object" && "segment_breakdown" in result.data && (
          <div className="flex gap-4 px-4 py-3 rounded-xl" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
            {Object.entries(result.data.segment_breakdown as Record<string, number>).map(([seg, pct]) => (
              <div key={seg} className="text-center flex-1">
                <p className="text-lg font-bold" style={{ color: seg === "enthusiasts" ? "var(--noctra-emerald)" : seg === "skeptics" ? "var(--noctra-rose)" : "var(--noctra-amber)" }}>{pct}%</p>
                <p className="text-xs capitalize" style={{ color: "var(--noctra-text-muted)" }}>{seg}</p>
              </div>
            ))}
          </div>
        )}
        <SwarmReportView report={{ payload: { data: result.data, markdown: result.markdown }, score: result.score ?? null }} />
        {saved && (
          <div className="flex gap-2 pt-1 border-t" style={{ borderColor: "var(--noctra-border)" }}>
            {savedReportId && (
              <NoctraButton variant="ghost" onClick={() => navigate(`/app/reports/${savedReportId}`)} className="flex-1">
                <ExternalLink size={12} /> View Full Report
              </NoctraButton>
            )}
            <NoctraButton variant="ghost" onClick={() => navigate("/app/mvp")} className="flex-1">
              Next: MVP Planner <ArrowRight size={12} />
            </NoctraButton>
          </div>
        )}
      </div>
    ) : null
  );

  return (
    <AppShell>
      <ToolScene
        icon={Users}
        label={TOOL.label}
        accent={TOOL.accent}
        phase={phase}
        description="Simulate market demand, test pricing, and identify market segments"
        inputPanel={InputPanel}
        outputPanel={OutputPanel}
        errorMessage={phase === "error" ? error : undefined}
      />
    </AppShell>
  );
}
