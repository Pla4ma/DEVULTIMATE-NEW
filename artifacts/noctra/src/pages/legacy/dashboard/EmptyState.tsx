import { Zap, Lightbulb, Stethoscope, FolderOpen, ArrowRight, CheckCircle } from "lucide-react";
import { Panel } from "@/components/Primitives";
import { ROUTES } from "@/lib/routes";

type Props = {
  navigate: (path: string) => void;
};

export function DashboardEmptyState({ navigate }: Props) {
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: "var(--signal)", boxShadow: "0 0 20px var(--signal-glow)" }}>
          <Zap size={20} className="text-black" />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Start by analyzing your idea or codebase.
        </h2>
        <p className="text-sm max-w-lg mx-auto" style={{ color: "var(--text-tertiary)" }}>
          Noctra scans for launch blockers, validates assumptions, and generates a prioritized execution plan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => navigate(ROUTES.doctor)} className="rounded-xl border p-5 text-left transition-all hover:opacity-90 group" style={{ background: "var(--surface-1)", borderColor: "var(--border-default)" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "var(--color-danger-soft)" }}>
            <Stethoscope size={18} style={{ color: "var(--color-danger)" }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Scan a codebase</p>
          <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>Upload your repo ZIP. Get launch readiness, gate status, prioritized fix tasks, and a build prompt.</p>
          <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--color-danger)", color: "#fff" }}>
            Upload Project ZIP <ArrowRight size={11} />
          </span>
        </button>

        <button onClick={() => navigate(ROUTES.idea)} className="rounded-xl border p-5 text-left transition-all hover:opacity-90 group" style={{ background: "var(--surface-1)", borderColor: "var(--border-default)" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "var(--cosmos-soft)" }}>
            <Lightbulb size={18} style={{ color: "var(--accent-violet)" }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Describe an idea</p>
          <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>Paste your idea. Get a signal score, top risks, and a verdict. Know what to validate next.</p>
          <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--signal)", color: "var(--surface-0)" }}>
            Check My Idea <ArrowRight size={11} />
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => navigate(ROUTES.projects)} className="rounded-xl border p-5 text-left transition-all hover:opacity-90 group" style={{ background: "var(--surface-1)", borderColor: "var(--border-default)" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "var(--color-success-soft)" }}>
            <FolderOpen size={18} style={{ color: "var(--color-success)" }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Create a project</p>
          <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>Set up a project to organize reports, tasks, and your execution plan in one place.</p>
          <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
            Create Project <ArrowRight size={11} />
          </span>
        </button>

        <button onClick={() => navigate(ROUTES.reality)} className="rounded-xl border p-5 text-left transition-all hover:opacity-90 group" style={{ background: "var(--surface-1)", borderColor: "var(--border-default)" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "var(--color-warning-soft)" }}>
            <Zap size={18} style={{ color: "var(--color-warning)" }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Test an assumption</p>
          <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>Stress-test a key assumption across feasibility, market viability, and blind spots.</p>
          <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
            Run Reality Check <ArrowRight size={11} />
          </span>
        </button>
      </div>

      <Panel>
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-tertiary)" }}>Capability overview:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Diagnose", desc: "Idea Checker + Project Doctor", color: "var(--color-danger)" },
            { label: "Validate", desc: "Reality Compiler, Proof Engine, Swarm", color: "var(--color-warning)" },
            { label: "Build", desc: "MVP Planner + Product Twin", color: "var(--signal)" },
            { label: "Launch", desc: "Launch Room + Project Profile", color: "var(--color-success)" },
          ].map(({ label, desc, color }) => (
            <div key={label} className="rounded-lg p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle size={10} style={{ color }} />
                <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{label}</p>
              </div>
              <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
