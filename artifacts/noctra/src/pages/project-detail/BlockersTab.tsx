import { useState, useEffect } from "react";
import { Panel, Badge, EmptyState, NoctraButton } from "@/components/Primitives";
import { getBlockers, updateBlocker, type Blocker } from "@/lib/repository";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Shield, AlertTriangle, CheckCircle, XCircle,
  AlertCircle, ArrowUpCircle,
} from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  P0: "var(--noctra-rose)",
  P1: "var(--noctra-amber)",
  P2: "var(--noctra-cyan)",
};

const CATEGORY_COLORS: Record<string, string> = {
  security: "var(--noctra-rose)",
  performance: "var(--noctra-amber)",
  testing: "var(--noctra-violet)",
  deployment: "var(--noctra-cyan)",
  docs: "var(--noctra-text-muted)",
  code: "var(--noctra-blue)",
  privacy: "var(--noctra-gold)",
  billing: "var(--noctra-emerald)",
};

const STATUS_COLORS_BLOCKER: Record<string, string> = {
  open: "var(--noctra-rose)",
  in_progress: "var(--noctra-amber)",
  fixed: "var(--noctra-emerald)",
  ignored: "var(--noctra-text-muted)",
};

export function BlockersTab(props: { projectId: string; navigate: (url: string) => void }) {
  const { projectId, navigate } = props;
  const { toast } = useToast();
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    getBlockers(projectId)
      .then(setBlockers)
      .catch((e) => toast({ title: "Failed to load blockers", description: e?.message ?? "Unknown error", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [projectId]);

  async function handleStatusChange(blocker: Blocker, newStatus: string) {
    try {
      const updated = await updateBlocker(blocker.id, { status: newStatus as Blocker["status"] });
      setBlockers((prev) => prev.map((b) => b.id === blocker.id ? { ...b, status: newStatus as Blocker["status"] } : b));
      toast({ title: `Blocker ${newStatus}`, description: `"${blocker.title}" marked as ${newStatus}.` });
    } catch (e) {
      toast({ title: "Failed to update blocker", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  }

  const p0Count = blockers.filter((b) => b.severity === "P0" && b.status === "open").length;
  const p1Count = blockers.filter((b) => b.severity === "P1" && b.status === "open").length;
  const fixedCount = blockers.filter((b) => b.status === "fixed").length;

  const filtered = filter === "all" ? blockers : blockers.filter((b) => b.status === filter);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin" style={{ color: "var(--noctra-cyan)" }} /></div>;
  }

  if (blockers.length === 0) {
    return (
      <EmptyState
        icon={<Shield size={24} />}
        title="No launch blockers"
        body="Run Product Doctor scan to identify blockers in your codebase."
      >
        <NoctraButton onClick={() => navigate("/app/doctor")}>
          <Shield size={12} /> Run Product Doctor
        </NoctraButton>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        <Panel>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-rose)" }}>P0 Critical</p>
          <p className="text-2xl font-bold" style={{ color: "var(--noctra-rose)" }}>{p0Count}</p>
        </Panel>
        <Panel>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-amber)" }}>P1 High</p>
          <p className="text-2xl font-bold" style={{ color: "var(--noctra-amber)" }}>{p1Count}</p>
        </Panel>
        <Panel>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-emerald)" }}>Fixed</p>
          <p className="text-2xl font-bold" style={{ color: "var(--noctra-emerald)" }}>{fixedCount}</p>
        </Panel>
        <Panel>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Total</p>
          <p className="text-2xl font-bold" style={{ color: "var(--noctra-text)" }}>{blockers.length}</p>
        </Panel>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "open", "in_progress", "fixed", "ignored"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1 rounded-full text-xs capitalize"
            style={{
              background: filter === f ? "var(--noctra-surface2)" : "transparent",
              border: `1px solid ${filter === f ? "var(--noctra-border)" : "transparent"}`,
              color: filter === f ? "var(--noctra-text)" : "var(--noctra-text-muted)",
            }}
          >
            {f === "all" ? `All (${blockers.length})` : `${f} (${blockers.filter(b => b.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Blocker list */}
      <div className="space-y-3">
        {filtered.map((blocker) => (
          <Panel key={blocker.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge
                    style={{
                      background: `${SEVERITY_COLORS[blocker.severity] ?? "var(--noctra-text-muted)"}18`,
                      color: SEVERITY_COLORS[blocker.severity] ?? "var(--noctra-text-muted)",
                    }}
                  >
                    {blocker.severity}
                  </Badge>
                  <Badge
                    style={{
                      background: `${CATEGORY_COLORS[blocker.category] ?? "var(--noctra-text-muted)"}18`,
                      color: CATEGORY_COLORS[blocker.category] ?? "var(--noctra-text-muted)",
                    }}
                  >
                    {blocker.category}
                  </Badge>
                  <Badge
                    style={{
                      background: `${STATUS_COLORS_BLOCKER[blocker.status] ?? "var(--noctra-text-muted)"}18`,
                      color: STATUS_COLORS_BLOCKER[blocker.status] ?? "var(--noctra-text-muted)",
                    }}
                  >
                    {blocker.status === "in_progress" ? "in progress" : blocker.status}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold" style={{ color: "var(--noctra-text)" }}>{blocker.title}</h4>
                {blocker.evidence && (
                  <p className="text-xs mt-1 font-mono" style={{ color: "var(--noctra-text-muted)" }}>
                    <span className="font-medium" style={{ color: "var(--noctra-amber)" }}>Evidence: </span>
                    {blocker.evidence}
                  </p>
                )}
                {blocker.why_it_matters && (
                  <p className="text-xs mt-1" style={{ color: "var(--noctra-text-soft)" }}>
                    <span className="font-medium" style={{ color: "var(--noctra-rose)" }}>Impact: </span>
                    {blocker.why_it_matters}
                  </p>
                )}
                {blocker.recommended_fix && (
                  <p className="text-xs mt-1" style={{ color: "var(--noctra-text-soft)" }}>
                    <span className="font-medium" style={{ color: "var(--noctra-cyan)" }}>Fix: </span>
                    {blocker.recommended_fix}
                  </p>
                )}
                {blocker.acceptance_criteria && (
                  <p className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>
                    <span className="font-medium" style={{ color: "var(--noctra-emerald)" }}>AC: </span>
                    {blocker.acceptance_criteria}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {blocker.status === "open" && (
                  <NoctraButton variant="ghost" onClick={() => handleStatusChange(blocker, "in_progress")} className="text-xs">
                    <ArrowUpCircle size={11} /> Start
                  </NoctraButton>
                )}
                {blocker.status === "in_progress" && (
                  <NoctraButton variant="ghost" onClick={() => handleStatusChange(blocker, "fixed")} className="text-xs">
                    <CheckCircle size={11} /> Fix
                  </NoctraButton>
                )}
                {(blocker.status === "open" || blocker.status === "in_progress") && (
                  <NoctraButton variant="ghost" onClick={() => handleStatusChange(blocker, "ignored")} className="text-xs">
                    <XCircle size={11} /> Ignore
                  </NoctraButton>
                )}
                {blocker.status === "fixed" && (
                  <NoctraButton variant="ghost" onClick={() => handleStatusChange(blocker, "open")} className="text-xs">
                    <AlertCircle size={11} /> Reopen
                  </NoctraButton>
                )}
                {blocker.status === "ignored" && (
                  <NoctraButton variant="ghost" onClick={() => handleStatusChange(blocker, "open")} className="text-xs">
                    <AlertTriangle size={11} /> Unignore
                  </NoctraButton>
                )}
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
