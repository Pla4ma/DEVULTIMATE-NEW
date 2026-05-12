import { IdeaReportView } from "./IdeaReportView";
import { RealityReportView } from "./RealityReportView";
import { ProofReportView } from "./ProofReportView";
import { SwarmReportView } from "./SwarmReportView";
import { MvpReportView } from "./MvpReportView";
import { DoctorReportView } from "./DoctorReportView";
import { LaunchReportView } from "./LaunchReportView";
import { GenericReportView } from "./GenericReportView";

type Report = {
  id?: string;
  tool: string;
  title: string;
  score?: number | null;
  summary?: string | null;
  payload: unknown;
  created_at: string;
  project_id?: string | null;
};

export function ReportRenderer({ report, projectId }: { report: Report; projectId?: string }) {
  switch (report.tool) {
    case "idea":    return <IdeaReportView report={report} />;
    case "reality": return <RealityReportView report={report} />;
    case "proof":   return <ProofReportView report={report} />;
    case "swarm":   return <SwarmReportView report={report} />;
    case "mvp":     return <MvpReportView report={report} />;
    case "doctor":  return (
      <DoctorReportView
        report={{ ...report, id: report.id ?? "" }}
        projectId={projectId ?? (typeof report.project_id === "string" ? report.project_id : undefined)}
      />
    );
    case "launch":  return <LaunchReportView report={report} />;
    default:        return <GenericReportView report={report} />;
  }
}
