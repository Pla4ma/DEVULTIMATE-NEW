import { useEffect, useState } from "react";
import { Panel, EmptyState, Badge, NoctraButton } from "@/components/Primitives";
import { getScanDelta, type ScanSnapshot, type ScanDelta } from "@/lib/repository";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, TrendingUp, TrendingDown, Minus,
  CheckCircle, XCircle, AlertTriangle, BarChart3, Clock,
} from "lucide-react";

export function ScanHistoryComparison(props: { projectId: string; navigate: (url: string) => void }) {
  const { projectId, navigate } = props;
  const { toast } = useToast();
  const [delta, setDelta] = useState<ScanDelta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    getScanDelta(projectId)
      .then(setDelta)
      .catch((e) => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin" style={{ color: "var(--noctra-cyan)" }} /></div>;
  }

  if (!delta || delta.delta?.isFirstScan || !delta.current) {
    return (
      <EmptyState
        icon={<BarChart3 size={24} />}
        title="No scan comparison yet"
        body="Run at least two Product Doctor scans to see your progress over time."
      >
        <NoctraButton onClick={() => navigate("/app/doctor")}>
          Run Product Doctor Scan
        </NoctraButton>
      </EmptyState>
    );
  }

  const d = delta.delta!;
  const scoreColor = d.scoreImproved
    ? "var(--noctra-emerald)"
    : d.scoreDeclined
    ? "var(--noctra-rose)"
    : "var(--noctra-text-muted)";
  const ScoreIcon = d.scoreImproved ? TrendingUp : d.scoreDeclined ? TrendingDown : Minus;
  const currentScore = delta.current.score ?? 0;
  const previousScore = delta.previous?.score ?? 0;

  return (
    <Panel>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={14} style={{ color: "var(--noctra-cyan)" }} />
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>
          Rescan Comparison
        </p>
        {delta.previous && (
          <span className="text-[10px] ml-auto" style={{ color: "var(--noctra-text-muted)" }}>
            <Clock size={10} className="inline mr-1" />
            {new Date(delta.current.created_at).toLocaleDateString()} vs {new Date(delta.previous.created_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Score comparison */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 rounded-lg" style={{ background: "var(--noctra-surface2)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--noctra-text-muted)" }}>Current</p>
          <p className="text-2xl font-bold" style={{ color: scoreColor }}>{currentScore}</p>
        </div>
        <div className="text-center p-3 rounded-lg" style={{ background: "var(--noctra-surface2)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--noctra-text-muted)" }}>Previous</p>
          <p className="text-2xl font-bold" style={{ color: "var(--noctra-text)" }}>{previousScore}</p>
        </div>
        <div className="text-center p-3 rounded-lg" style={{ background: "var(--noctra-surface2)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--noctra-text-muted)" }}>Change</p>
          <div className="flex items-center justify-center gap-1">
            <ScoreIcon size={16} style={{ color: scoreColor }} />
            <span className="text-2xl font-bold" style={{ color: scoreColor }}>
              {d.scoreDelta > 0 ? "+" : ""}{d.scoreDelta}
            </span>
          </div>
        </div>
      </div>

      {/* Blocker comparison */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle size={11} style={{ color: "var(--noctra-emerald)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--noctra-emerald)" }}>Fixed</span>
          </div>
          <p className="text-lg font-bold" style={{ color: "var(--noctra-emerald)" }}>{d.fixedBlockers}</p>
          <p className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>blockers resolved since last scan</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <XCircle size={11} style={{ color: "var(--noctra-rose)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--noctra-rose)" }}>New</span>
          </div>
          <p className="text-lg font-bold" style={{ color: "var(--noctra-rose)" }}>{d.newBlockers}</p>
          <p className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>new blockers introduced</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={11} style={{ color: "var(--noctra-amber)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--noctra-amber)" }}>Unresolved</span>
          </div>
          <p className="text-lg font-bold" style={{ color: "var(--noctra-amber)" }}>{d.unresolvedBlockers}</p>
          <p className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>blockers still open</p>
        </div>
      </div>

      {/* Summary text */}
      <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: "var(--noctra-surface2)", color: "var(--noctra-text-soft)" }}>
        {d.scoreImproved
          ? `Score improved by ${d.scoreDelta} points — your fixes are working. ${d.fixedBlockers} blocker${d.fixedBlockers !== 1 ? "s" : ""} resolved since last scan.`
          : d.scoreDeclined
          ? `Score dropped by ${Math.abs(d.scoreDelta)} points — ${d.newBlockers} new blocker${d.newBlockers !== 1 ? "s" : ""} detected. Review and fix the new issues.`
          : `Score unchanged at ${currentScore}. ${d.fixedBlockers} blocker${d.fixedBlockers !== 1 ? "s" : ""} fixed, ${d.newBlockers} new blocker${d.newBlockers !== 1 ? "s" : ""} introduced.`}
        {d.unresolvedBlockers > 0 && ` ${d.unresolvedBlockers} blocker${d.unresolvedBlockers !== 1 ? "s" : ""} still need attention.`}
      </div>
    </Panel>
  );
}
