import { useState } from "react";
import { useLocation } from "wouter";
import { ClipboardList, ExternalLink, FolderOpen, Terminal, Copy, Check, Download, Package, Loader2, FileText } from "lucide-react";
import { Panel, Badge, NoctraButton } from "@/components/Primitives";
import { downloadMarkdown } from "@/lib/export";
import { generateDevAgentPrompt } from "@/lib/brief-generator";
import { generatePromptPackFromReport, exportPromptPackToMarkdown } from "@/lib/prompt-pack";
import type { DoctorData, Gate } from "./doctor-types";
import { ROUTES } from "@/lib/routes";

type Props = {
  report: { id: string; payload: unknown; score?: number | null; project_id?: string | null; [key: string]: unknown };
  pd: DoctorData;
  score: number;
  readinessScore: number;
  gates: Gate[];
  redGates: Gate[];
  redGateNames: string[];
  allBlockers: string[];
  repairQueue: string[];
  fixPlan: { title: string; priority: string; effort_hours?: number; files?: string[]; acceptance_criteria?: string[] }[];
  evidence: { filePath: string; lineNumber?: number; snippet?: string; severity: string; explanation: string; signal: string }[];
  navigate: (path: string) => void;
};

export function DoctorGeneratedExecution({ report, pd, score, readinessScore, gates, redGates, redGateNames, allBlockers, repairQueue, fixPlan, evidence, navigate }: Props) {
  const [promptCopied, setPromptCopied] = useState(false);
  const [generatingPack, setGeneratingPack] = useState(false);
  const [briefCopied, setBriefCopied] = useState(false);

  function generateNextBuildPrompt(): string {
    return generateDevAgentPrompt({
      project: { name: "Current Project", idea: pd.summary },
      state: {
        stage: "LAUNCH_READY",
        readiness: readinessScore,
        doctorScore: score,
        failedGates: [...new Set([...redGates.map(g => g.name), ...redGateNames])],
        topBlocker: pd.top_blocker ?? null,
        nextAction: { title: pd.recommended_action ?? "Fix launch blockers", href: ROUTES.tasks, reason: "", description: "", priority: "high", tool: "doctor" },
        ideaScore: 0, realityScore: 0, proofScore: 0, swarmScore: 0, mvpScore: 0, launchScore: 0,
        overallScore: 0, coveredTools: [], missingTools: [], openP0Tasks: 0, openP1Tasks: 0,
        latestReportByTool: {}, proofSignalCount: 0, scanCount: 0, totalReports: 0,
        totalTasks: 0, completedTasks: 0, taskCompletionRate: 0,
      },
      tasks: [],
      doctorPayload: report.payload,
    });
  }

  async function copyPrompt() {
    const prompt = generateNextBuildPrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2500);
    } catch {
      downloadMarkdown("next-build-prompt", prompt);
    }
  }

  function downloadPrompt() {
    const prompt = generateNextBuildPrompt();
    downloadMarkdown("next-build-prompt", prompt);
  }

  async function handleGeneratePromptPack() {
    setGeneratingPack(true);
    try {
      const pack = generatePromptPackFromReport(
        { id: report.id, tool: "doctor", title: "Product Doctor Report", payload: report.payload },
        "Replit"
      );
      const md = exportPromptPackToMarkdown(pack);
      downloadMarkdown("doctor-prompt-pack", md);
      setBriefCopied(true);
      setTimeout(() => setBriefCopied(false), 2500);
    } finally {
      setGeneratingPack(false);
    }
  }

  function handleExportFixPlan() {
    const lines: string[] = [
      `# Doctor Fix Plan — ${new Date().toLocaleDateString()}`,
      "",
      `Health Score: ${score}/100`,
      `Launch Readiness: ${pd.launch_readiness ?? "N/A"}`,
      `Top Blocker: ${pd.top_blocker ?? "None"}`,
      "",
      "## Launch Gates",
      ...gates.map(g => `- [${g.status}] ${g.name}${g.how_to_fix ? ` → Fix: ${g.how_to_fix}` : ""}`),
      "",
      "## Repair Queue",
      ...repairQueue.map((item, i) => `${i + 1}. ${item}`),
      "",
      "## Fix Plan",
      ...fixPlan.map(f => `- [${f.priority}] ${f.title}${f.files ? ` (Files: ${f.files.join(", ")})` : ""}${f.acceptance_criteria ? `\n  AC: ${f.acceptance_criteria.join("; ")}` : ""}`),
      "",
      "## Evidence Index",
      ...evidence.slice(0, 20).map(e => `- [${e.severity}] ${e.filePath}${e.lineNumber ? `:${e.lineNumber}` : ""} — ${e.explanation || e.signal}`),
    ];
    downloadMarkdown("doctor-fix-plan", lines.join("\n"));
  }

  return (
    <Panel>
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList size={13} style={{ color: "var(--color-success)" }} />
        <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Generated Execution</p>
      </div>

      {report.id && (
        <div className="mb-3 pb-3 border-b" style={{ borderColor: "var(--border-default)" }}>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-primary)" }}>Fix Tasks</p>
          <div className="flex flex-wrap gap-2">
            <NoctraButton variant="ghost" onClick={() => navigate(`/app/tasks?report=${report.id}`)}>
              <ExternalLink size={11} /> View Fix Tasks
            </NoctraButton>
            {report.project_id && (
              <NoctraButton variant="ghost" onClick={() => navigate(`/app/projects/${report.project_id}`)}>
                <FolderOpen size={11} /> Open Project
              </NoctraButton>
            )}
          </div>
        </div>
      )}

      <div className="mb-3 pb-3 border-b" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Terminal size={13} style={{ color: "var(--signal)" }} />
          <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Next Build Prompt</p>
        </div>
        <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
          Copy this prompt into Codex, Replit Agent, Cursor, or Windsurf to fix all identified issues.
        </p>
        <div className="flex items-center gap-2 mb-2">
          <Badge style={{ fontSize: "9px", background: "var(--signal-soft)", color: "var(--signal)" }}>Codex</Badge>
          <Badge style={{ fontSize: "9px", background: "var(--signal-soft)", color: "var(--signal)" }}>Replit</Badge>
          <Badge style={{ fontSize: "9px", background: "var(--signal-soft)", color: "var(--signal)" }}>Cursor</Badge>
          <Badge style={{ fontSize: "9px", background: "var(--signal-soft)", color: "var(--signal)" }}>Windsurf</Badge>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyPrompt}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: promptCopied ? "var(--color-success-soft)" : "var(--signal)", color: promptCopied ? "var(--color-success)" : "#000" }}
          >
            {promptCopied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy Prompt</>}
          </button>
          <button
            onClick={downloadPrompt}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
          >
            <Download size={11} /> Download
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Package size={13} style={{ color: "var(--accent-violet)" }} />
          <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Prompt Pack</p>
        </div>
        <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
          Generate a multi-step prompt pack with phase-by-phase repair instructions for your AI coding tool.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleGeneratePromptPack}
            disabled={generatingPack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: generatingPack ? "var(--cosmos-soft)" : "var(--surface-2)", color: "var(--accent-violet)", border: "1px solid var(--cosmos-soft)" }}
          >
            {generatingPack ? <Loader2 size={11} className="animate-spin" /> : <Package size={11} />}
            Generate Prompt Pack
          </button>
          <button
            onClick={handleExportFixPlan}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
          >
            <FileText size={11} /> Export Fix Plan
          </button>
        </div>
      </div>
    </Panel>
  );
}
