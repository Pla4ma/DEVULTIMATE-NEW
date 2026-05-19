import { Zap, Lightbulb, Stethoscope, FolderOpen, ArrowRight, CheckCircle } from "lucide-react";
import { Panel } from "@/components/Primitives";

type Props = {
  navigate: (path: string) => void;
};

export function DashboardEmptyState({ navigate }: Props) {
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: "var(--noctra-cyan)", boxShadow: "0 0 20px var(--noctra-cyan-glow)" }}>
          <Zap size={20} className="text-black" />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--noctra-text)" }}>
          Start by analyzing your idea or codebase.
        </h2>
        <p className="text-sm max-w-lg mx-auto" style={{ color: "var(--noctra-text-muted)" }}>
          Noctra scans for launch blockers, validates assumptions, and generates a prioritized execution plan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => navigate("/app/doctor")} className="rounded-xl border p-5 text-left transition-all hover:opacity-90 group" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(244,63,94,0.12)" }}>
            <Stethoscope size={18} style={{ color: "var(--noctra-rose)" }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--noctra-text)" }}>Scan a codebase</p>
          <p className="text-xs mb-3" style={{ color: "var(--noctra-text-muted)" }}>Upload your repo ZIP. Get launch readiness, gate status, prioritized fix tasks, and a build prompt.</p>
          <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--noctra-rose)", color: "#fff" }}>
            Upload Project ZIP <ArrowRight size={11} />
          </span>
        </button>

        <button onClick={() => navigate("/app/idea")} className="rounded-xl border p-5 text-left transition-all hover:opacity-90 group" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(149,117,255,0.12)" }}>
            <Lightbulb size={18} style={{ color: "var(--noctra-violet)" }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--noctra-text)" }}>Describe an idea</p>
          <p className="text-xs mb-3" style={{ color: "var(--noctra-text-muted)" }}>Paste your idea. Get a signal score, top risks, and a verdict. Know what to validate next.</p>
          <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--noctra-cyan)", color: "#000" }}>
            Check My Idea <ArrowRight size={11} />
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => navigate("/app/projects")} className="rounded-xl border p-5 text-left transition-all hover:opacity-90 group" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(52,211,153,0.12)" }}>
            <FolderOpen size={18} style={{ color: "var(--noctra-emerald)" }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--noctra-text)" }}>Create a project</p>
          <p className="text-xs mb-3" style={{ color: "var(--noctra-text-muted)" }}>Set up a project to organize reports, tasks, and your execution plan in one place.</p>
          <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)" }}>
            Create Project <ArrowRight size={11} />
          </span>
        </button>

        <button onClick={() => navigate("/app/reality")} className="rounded-xl border p-5 text-left transition-all hover:opacity-90 group" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(245,158,11,0.12)" }}>
            <Zap size={18} style={{ color: "var(--noctra-amber)" }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--noctra-text)" }}>Test an assumption</p>
          <p className="text-xs mb-3" style={{ color: "var(--noctra-text-muted)" }}>Stress-test a key assumption across feasibility, market viability, and blind spots.</p>
          <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)" }}>
            Run Reality Check <ArrowRight size={11} />
          </span>
        </button>
      </div>

      <Panel>
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--noctra-text-muted)" }}>Capability overview:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Diagnose", desc: "Idea Checker + Project Doctor", color: "var(--noctra-rose)" },
            { label: "Validate", desc: "Reality Compiler, Proof Engine, Swarm", color: "var(--noctra-amber)" },
            { label: "Build", desc: "MVP Planner + Product Twin", color: "var(--noctra-cyan)" },
            { label: "Launch", desc: "Launch Room + Project Profile", color: "var(--noctra-emerald)" },
          ].map(({ label, desc, color }) => (
            <div key={label} className="rounded-lg p-3" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle size={10} style={{ color }} />
                <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{label}</p>
              </div>
              <p className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
