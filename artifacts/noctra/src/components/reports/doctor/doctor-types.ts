export type Gate = { name: string; status: "GREEN" | "YELLOW" | "RED"; evidence?: string[]; how_to_fix?: string; why?: string };
export type Issue = { severity: string; issue: string; fix?: string; file?: string; line?: number; explanation?: string };
export type FixPlanItem = { title: string; priority: string; effort_hours?: number; files?: string[]; acceptance_criteria?: string[] };
export type EvidenceItem = { filePath: string; lineNumber?: number; snippet?: string; severity: string; explanation: string; signal: string };

export type ScanData = {
  fileCount?: number;
  totalLines?: number;
  framework?: string;
  packageManager?: string;
  languages?: Record<string, number>;
  repoMap?: {
    components: string[];
    routes: string[];
    apiFiles: string[];
    hooks: string[];
    utilities: string[];
    services: string[];
    authFiles: string[];
    dbFiles: string[];
    aiFiles: string[];
    paymentFiles: string[];
    uploadFiles: string[];
    configFiles: string[];
    testFiles: string[];
    deploymentFiles: string[];
    docsFiles: string[];
  };
  evidenceIndex?: EvidenceItem[];
};

export type AlignmentData = {
  missingProductRequirements?: Array<{ title: string; description: string; severity: string }>;
  builtButUnnecessary?: Array<{ title: string; description: string; severity: string }>;
  riskyImplementationChoices?: Array<{ title: string; description: string; severity: string }>;
  MVPFeatureCoverage?: Array<{ feature: string; status: string }>;
  recommendedCodeTasks?: Array<{ title: string; priority: string; reason: string }>;
  launchBlockers?: string[];
};

export type DoctorData = {
  verdict?: string;
  summary?: string;
  health_score?: number;
  launch_readiness?: string;
  launch_readiness_score?: number;
  score?: number;
  top_blocker?: string;
  recommended_action?: string;
  gates?: Gate[];
  issues?: Issue[];
  repair_queue?: string[];
  fix_plan?: FixPlanItem[];
  red_gates?: string[];
  yellow_gates?: string[];
  evidence?: EvidenceItem[];
  alignment?: AlignmentData;
  next_actions?: string[];
  critical_issues?: string[];
  security_findings?: string[];
  testing_gaps?: string[];
  deployment_gaps?: string[];
};

export type Props = {
  report: { id: string; payload: unknown; score?: number | null; project_id?: string | null; [key: string]: unknown };
  projectId?: string;
};
