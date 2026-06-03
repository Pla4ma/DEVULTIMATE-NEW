import { Panel, Badge, EmptyState, NoctraButton } from "@/components/Primitives";
import { ReportRenderer } from "@/components/reports/ReportRenderer";
import { Rocket, Loader2, CheckSquare, ArrowRight } from "lucide-react";
import { SCORE_COLOR, type Report } from "./types";
import { ROUTES } from "@/lib/routes";

interface LaunchTabProps {
  latestLaunchReport: Report | null;
  generatingTasks: string | null;
  onGenerateTasks: (report: Report) => void;
  navigate: (url: string) => void;
}

export function LaunchTab({ latestLaunchReport, generatingTasks, onGenerateTasks, navigate }: LaunchTabProps) {
  return (
    <div className="space-y-3">
      {latestLaunchReport ? (
        <>
          <Panel className="glass">
            <div className="flex items-center gap-3 mb-3">
              <Rocket size={14} style={{ color: "var(--color-warning)" }} />
              <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Launch Assessment</p>
              {latestLaunchReport.score != null ? <Badge style={{ marginLeft: "auto", background: `${SCORE_COLOR(latestLaunchReport.score)}18`, color: SCORE_COLOR(latestLaunchReport.score) }}>{latestLaunchReport.score}/100</Badge> : null}
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>{latestLaunchReport.title}</p>
            {latestLaunchReport.summary ? <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{latestLaunchReport.summary}</p> : null}
            <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>{new Date(latestLaunchReport.created_at).toLocaleDateString()}</p>
          </Panel>
          <Panel className="glass"><ReportRenderer report={latestLaunchReport} /></Panel>
          <div className="flex gap-2 flex-wrap">
            <NoctraButton variant="ghost" onClick={() => navigate(ROUTES.reportDetail(latestLaunchReport.id))}>Full Report <ArrowRight size={11} /></NoctraButton>
            <NoctraButton variant="ghost" onClick={() => onGenerateTasks(latestLaunchReport)} disabled={generatingTasks === latestLaunchReport.id}>
              {generatingTasks === latestLaunchReport.id ? <Loader2 size={12} className="animate-spin" /> : <CheckSquare size={12} />} Generate Launch Tasks
            </NoctraButton>
            <NoctraButton variant="ghost" onClick={() => navigate(ROUTES.launch)}><Rocket size={13} /> Re-run Launch Room</NoctraButton>
          </div>
        </>
      ) : (
        <>
          <EmptyState icon={<Rocket size={22} />} title="No launch report yet" body="Run Launch Room to get your go/no-go signal with a full checklist and distribution plan." />
          <div className="flex justify-center"><NoctraButton onClick={() => navigate(ROUTES.launch)}><Rocket size={13} /> Run Launch Room</NoctraButton></div>
        </>
      )}
    </div>
  );
}
