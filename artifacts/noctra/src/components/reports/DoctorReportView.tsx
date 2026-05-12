import { useState } from "react";
import { ScoreRing, Badge, Panel, EmptyState, StatusDot, ProgressBar } from "@/components/Primitives";
import { Stethoscope, Rocket, CheckSquare, Copy, Check } from "lucide-react";
import { createTask } from "@/lib/repository";

type Gate = { name: string; status: "GREEN" | "YELLOW" | "RED"; evidence?: string[]; how_to_fix?: string; why?: string };
type Issue = { severity: string; issue: string; fix?: string; file?: string };
type FixPlan = { title: string; priority: string; effort_hours?: number };

type DoctorData = {
  verdict?: string;
  summary?: string;
  health_score?: number;
  score?: number;
  framework?: string;
  gates?: Gate[];
  issues?: Issue[];
  repair_queue?: string[];
  fix_plan?: FixPlan[];
  next_actions?: string[];
  critical_issues?: string[];
};

type Props = {
  report: { id: string; payload: unknown; score?: number | null; [key: string]: unknown };
  projectId?: string;
};

function useCreateTask() {
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  async function generate(items: string[], reportId: string, projectId?: string) {
    setCreating(true);
    try {
      await Promise.all(
        items.slice(0, 8).map((item) =>
          createTask({
            title: item,
            priority: "high",
            category: "launch",
            sourceReportId: reportId,
            projectId,
          })
        )
      );
      setCreated(true);
      setTimeout(() => setCreated(false), 3000);
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  }

  return { creating, created, generate };
}

export function DoctorReportView({ report, projectId }: Props) {
  const p = report.payload as Record<string, unknown>;
  const data = (p?.data ?? p) as DoctorData | null;
  const { creating, created, generate } = useCreateTask();
  const [briefCopied, setBriefCopied] = useState(false);

  if (!data) return <EmptyState icon={<Stethoscope size={24} />} title="No data available" />;

  const score = data.health_score ?? data.score ?? report.score ?? 0;
  const gates = data.gates ?? [];
  const redCount = gates.filter(g => g.status === "RED").length;
  const yellowCount = gates.filter(g => g.status === "YELLOW").length;
  const greenCount = gates.filter(g => g.status === "GREEN").length;

  const redGateNames = gates.filter((g) => g.status === "RED").map((g) => g.name);
  const criticalIssues = (data.issues ?? []).filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH").map((i) => i.issue);
  const autopilotItems = [...redGateNames.map((g) => `Fix launch gate: ${g}`), ...criticalIssues].slice(0, 8);

  const repairItems = data.repair_queue ?? [];

  function copyAutopilot() {
    const text = autopilotItems.map((item, i) => `${i + 1}. ${item}`).join("\n");
    navigator.clipboard.writeText(`# Launch Fix Plan\n\n${text}`).catch(() => {});
    setBriefCopied(true);
    setTimeout(() => setBriefCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-start flex-wrap">
        <ScoreRing value={score} label="Health" color="var(--noctra-rose)" />
        <div className="flex-1 min-w-0">
          {data.verdict && <p className="text-sm font-semibold mb-2" style={{ color: "var(--noctra-text)" }}>{data.verdict}</p>}
          {data.summary && <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{data.summary}</p>}
          {data.framework && <p className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>Framework: {data.framework}</p>}
          <div className="flex gap-2 mt-2 flex-wrap">
            {redCount > 0 && <Badge variant="rose">{redCount} RED gates</Badge>}
            {yellowCount > 0 && <Badge variant="amber">{yellowCount} YELLOW</Badge>}
            {greenCount > 0 && <Badge variant="emerald">{greenCount} GREEN</Badge>}
          </div>
        </div>
      </div>

      {/* Launch Gate Autopilot — Feature 4 */}
      {autopilotItems.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Rocket size={14} style={{ color: "var(--noctra-rose)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-rose)" }}>Launch Gate Autopilot</p>
            <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-rose)" }}>
              {autopilotItems.length} blockers
            </span>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--noctra-text-muted)" }}>
            These items are blocking your launch. Generate tasks or copy the fix plan.
          </p>
          <div className="space-y-1.5 mb-3">
            {autopilotItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: "var(--noctra-rose)" }}>{i + 1}.</span>
                <p className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{item}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => generate(autopilotItems, report.id, projectId)}
              disabled={creating || created}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: created ? "rgba(52,211,153,0.15)" : "var(--noctra-rose)",
                color: created ? "var(--noctra-emerald)" : "#fff",
                opacity: creating ? 0.7 : 1,
              }}
            >
              {created ? <><Check size={11} /> Tasks created</> : creating ? "Creating…" : <><CheckSquare size={11} /> Generate fix tasks</>}
            </button>
            <button
              onClick={copyAutopilot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "var(--noctra-surface2)", color: "var(--noctra-text-muted)", border: "1px solid var(--noctra-border)" }}
            >
              {briefCopied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy fix plan</>}
            </button>
          </div>
        </div>
      )}

      {gates.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>Launch Gates</p>
          <div className="space-y-2">
            {gates.map((g, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <StatusDot status={g.status} />
                  <span className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>{g.name}</span>
                  <Badge variant={g.status === "GREEN" ? "emerald" : g.status === "YELLOW" ? "amber" : "rose"}>{g.status}</Badge>
                </div>
                {g.evidence && g.evidence.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {g.evidence.slice(0, 3).map((e, j) => <li key={j} className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>• {e}</li>)}
                  </ul>
                )}
                {(g.how_to_fix ?? g.why) && (
                  <p className="text-xs mt-1.5" style={{ color: "var(--noctra-text-soft)" }}>{g.how_to_fix ?? g.why}</p>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {repairItems.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-amber)" }}>Repair Queue</p>
          <ol className="space-y-1.5">
            {repairItems.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm" style={{ color: "var(--noctra-text-soft)" }}>
                <span className="text-xs font-mono shrink-0" style={{ color: "var(--noctra-text-muted)" }}>{i + 1}.</span>{item}
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {data.issues && data.issues.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-rose)" }}>Issues</p>
          <div className="space-y-2">
            {data.issues.map((issue, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm" style={{ color: "var(--noctra-text)" }}>{issue.issue}</p>
                  <Badge variant={issue.severity === "CRITICAL" || issue.severity === "HIGH" ? "rose" : issue.severity === "LOW" ? "emerald" : "amber"}>{issue.severity}</Badge>
                </div>
                {issue.file && <p className="text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>{issue.file}</p>}
                {issue.fix && <p className="text-xs mt-1" style={{ color: "var(--noctra-text-soft)" }}>Fix: {issue.fix}</p>}
              </div>
            ))}
          </div>
        </Panel>
      )}

      <ProgressBar value={score} color="var(--noctra-rose)" />
    </div>
  );
}
