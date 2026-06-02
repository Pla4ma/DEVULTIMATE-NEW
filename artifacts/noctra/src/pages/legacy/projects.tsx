import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Panel, EmptyState, Badge, NoctraButton } from "@/components/Primitives";
import { getProjects, createProject, deleteProject, getReports, getTasks } from "@/lib/repository";
import { FolderOpen, Loader2, Plus, Trash2, ArrowRight, FileText, CheckSquare, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Project = {
  id: string; name: string; idea?: string | null;
  stage?: string | null; status?: string | null; created_at: string;
};

const STAGES = ["idea", "validation", "building", "launched", "paused"] as const;
const STAGE_COLORS: Record<string, string> = {
  idea: "var(--accent-violet)", validation: "var(--color-warning)",
  building: "var(--signal)", launched: "var(--color-success)", paused: "var(--text-tertiary)",
};

export default function ProjectsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [stage, setStage] = useState<typeof STAGES[number]>("idea");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    getProjects()
      .then(async (p) => {
        const proj = (p as Project[]) ?? [];
        setProjects(proj);
        const statsPromises = proj.map(async (project) => {
          const [reps, tsks] = await Promise.all([
            getReports(undefined, project.id).catch(() => []),
            getTasks(project.id).catch(() => []),
          ]);
          return { id: project.id, reports: (reps as unknown[]).length, tasks: (tsks as unknown[]).length };
        });
        const stats = await Promise.all(statsPromises);
        const rc: Record<string, number> = {};
        const tc: Record<string, number> = {};
        stats.forEach((s) => { rc[s.id] = s.reports; tc[s.id] = s.tasks; });
        setReportCounts(rc);
        setTaskCounts(tc);
      })
      .catch((err) => toast({ title: "Failed to load projects", description: err?.message ?? "Unknown error", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const proj = await createProject({ name: name.trim(), idea: idea.trim() || undefined, stage });
      setProjects((prev) => [proj as Project, ...prev]);
      setReportCounts((prev) => ({ ...prev, [(proj as Project).id]: 0 }));
      setTaskCounts((prev) => ({ ...prev, [(proj as Project).id]: 0 }));
      setName(""); setIdea(""); setStage("idea"); setShowForm(false);
    } catch (err) { toast({ title: "Failed to create project", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" }); } finally { setCreating(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setConfirmDelete(null);
    } catch (err) { toast({ title: "Failed to delete project", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" }); } finally { setDeleting(null); }
  }

  const filtered = stageFilter === "all" ? projects : projects.filter((p) => p.stage === stageFilter);

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Projects</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <NoctraButton onClick={() => setShowForm((v) => !v)}>
            <Plus size={13} /> New Project
          </NoctraButton>
        </div>

        {showForm && (
          <Panel>
            <div className="space-y-3">
              <p className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>New Project</p>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} autoFocus />
              <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Core idea (optional)" rows={2} className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
              <div>
                <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>Stage</p>
                <div className="flex gap-2 flex-wrap">
                  {STAGES.map((s) => (
                    <button key={s} onClick={() => setStage(s)} className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-all" style={{ background: stage === s ? `${STAGE_COLORS[s]}20` : "var(--surface-2)", border: `1px solid ${stage === s ? STAGE_COLORS[s] : "var(--border-default)"}`, color: stage === s ? STAGE_COLORS[s] : "var(--text-tertiary)" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <NoctraButton onClick={handleCreate} disabled={creating || !name.trim()} className="flex-1">
                  {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create Project
                </NoctraButton>
                <NoctraButton variant="ghost" onClick={() => setShowForm(false)}>Cancel</NoctraButton>
              </div>
            </div>
          </Panel>
        )}

        <div className="flex gap-1.5 flex-wrap">
          {["all", ...STAGES].map((s) => (
            <button key={s} onClick={() => setStageFilter(s)} className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-all" style={{ background: stageFilter === s ? (s !== "all" ? `${STAGE_COLORS[s]}20` : "var(--surface-2)") : "transparent", border: `1px solid ${stageFilter === s ? (s !== "all" ? STAGE_COLORS[s] : "var(--border-default)") : "transparent"}`, color: stageFilter === s ? (s !== "all" ? STAGE_COLORS[s] : "var(--text-primary)") : "var(--text-tertiary)" }}>
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={22} className="animate-spin" style={{ color: "var(--signal)" }} /></div>
        ) : filtered.length === 0 ? (
          <div className="space-y-3">
            <EmptyState icon={<FolderOpen size={24} />} title="No projects yet" body="Create your first project to start organizing your reports, tasks, and scans." />
            <div className="flex justify-center">
              <NoctraButton onClick={() => setShowForm(true)}><Plus size={13} /> Create Project</NoctraButton>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((proj) => {
              const stageColor = STAGE_COLORS[proj.stage ?? "idea"] ?? "var(--text-tertiary)";
              const reportCount = reportCounts[proj.id] ?? 0;
              const taskCount = taskCounts[proj.id] ?? 0;
              return (
                <Panel key={proj.id} style={{ cursor: "pointer" }}>
                  <div className="flex items-start gap-4">
                    <button className="flex-1 text-left" onClick={() => navigate(`/app/projects/${proj.id}`)}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge style={{ background: `${stageColor}18`, color: stageColor, textTransform: "capitalize" }}>
                          {proj.stage ?? "idea"}
                        </Badge>
                        {proj.status && proj.status !== "active" && <Badge>{proj.status}</Badge>}
                        <span className="text-xs ml-auto" style={{ color: "var(--text-tertiary)" }}>
                          {new Date(proj.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{proj.name}</p>
                      {proj.idea && <p className="text-xs mb-2 line-clamp-2" style={{ color: "var(--text-tertiary)" }}>{proj.idea}</p>}
                      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
                        <span className="flex items-center gap-1"><FileText size={11} /> {reportCount} report{reportCount !== 1 ? "s" : ""}</span>
                        <span className="flex items-center gap-1"><CheckSquare size={11} /> {taskCount} task{taskCount !== 1 ? "s" : ""}</span>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0 mt-1">
                      <NoctraButton variant="ghost" onClick={() => navigate(`/app/projects/${proj.id}`)}><ArrowRight size={13} /></NoctraButton>
                      {confirmDelete === proj.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(proj.id)} disabled={deleting === proj.id} className="text-xs px-2 py-1 rounded" style={{ color: "var(--color-danger)" }}>
                            {deleting === proj.id ? <Loader2 size={10} className="animate-spin" /> : "Delete"}
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs px-2 py-1 rounded" style={{ color: "var(--text-tertiary)" }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(proj.id)} className="p-1 rounded opacity-30 hover:opacity-100 transition-opacity">
                          <Trash2 size={13} style={{ color: "var(--color-danger)" }} />
                        </button>
                      )}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
