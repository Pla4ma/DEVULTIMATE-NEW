import { saveTasks } from "./repository";

export interface Task {
  id: string;
  title: string;
  detail?: string;
  priority: "high" | "medium" | "low";
  category: string;
  acceptance_criteria?: string[];
  source_report_id?: string;
  project_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SprintDay {
  day: string;
  goal: string;
  tasks: string[];
  acceptance_criteria: string[];
}

export interface Sprint {
  id: string;
  title: string;
  days: SprintDay[];
  risks: string[];
  demo_checklist: string[];
  duration?: number;
  maxTasksPerDay?: number;
}

interface DraftTask {
  title: string;
  detail?: string;
  priority: "high" | "medium" | "low";
  category: string;
  acceptance_criteria?: string[];
  sourceReportId?: string;
  projectId?: string | null;
}

export function normalizePriority(value: unknown): "high" | "medium" | "low" {
  const v = String(value ?? "medium").toLowerCase();
  if (v === "high" || v === "critical" || v === "urgent") return "high";
  if (v === "low" || v === "minor") return "low";
  return "medium";
}

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v.trim() : v == null ? fallback : String(v).trim();

function truncate(s: string, max = 100): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export async function generateTasksFromReport(input: {
  id: string;
  tool: string;
  payload: unknown;
  project_id?: string | null;
}): Promise<number> {
  const payload = asObj(input.payload);
  const data = asObj(payload.data ?? payload);
  if (!data || Object.keys(data).length === 0) return 0;

  const drafts: DraftTask[] = [];
  const base = { sourceReportId: input.id, projectId: input.project_id ?? null };

  function push(t: Omit<DraftTask, "sourceReportId" | "projectId">) {
    if (!t.title?.trim()) return;
    drafts.push({ ...base, ...t });
  }

  switch (input.tool) {
    case "idea": {
      // Next actions from signal analysis
      asArray(data.next_actions).slice(0, 6).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(title), priority: "high", category: "strategy", detail: "Generated from Idea Checker analysis" });
      });
      // Each risky assumption becomes a validation task
      asArray(data.assumptions).slice(0, 5).forEach((raw) => {
        const a = asObj(raw);
        const assumption = str(a.assumption);
        const test = str(a.test);
        if (!assumption) return;
        push({
          title: truncate(`Validate: ${assumption}`),
          detail: test || `Test assumption: ${assumption}`,
          priority: normalizePriority(a.risk),
          category: "validation",
          acceptance_criteria: test ? [`Assumption "${assumption}" is tested and validated`] : undefined,
        });
      });
      // Errors and warnings in idea analysis
      asArray(data.errors).slice(0, 4).forEach((e) => {
        const title = str(e);
        if (title) push({ title: truncate(`Fix error: ${title}`), priority: "high", category: "strategy" });
      });
      asArray(data.warnings).slice(0, 4).forEach((w) => {
        const title = str(w);
        if (title) push({ title: truncate(`Address: ${title}`), priority: "medium", category: "strategy" });
      });
      // Product patch from idea
      asArray(data.product_patch).slice(0, 3).forEach((p) => {
        const patch = str(p);
        if (patch) push({ title: truncate(`Apply patch: ${patch}`), priority: "high", category: "development" });
      });
      // Sharpest experiment as a standalone task
      const experiment = str(data.sharpest_experiment);
      if (experiment) {
        push({ title: truncate(`Run: ${experiment}`), detail: "Sharpest experiment from Idea Checker", priority: "high", category: "validation" });
      }
      break;
    }

    case "reality": {
      // Patch plan items — these are the actual actionable fixes
      asArray(data.patch_plan).slice(0, 8).forEach((raw) => {
        const p = asObj(raw);
        const problem = str(p.problem);
        const patch = str(p.patch);
        if (!patch && !problem) return;
        push({
          title: truncate(patch || `Fix: ${problem}`),
          detail: problem ? `Problem: ${problem}` : undefined,
          priority: normalizePriority(p.priority ?? p.effort),
          category: "strategy",
        });
      });
      // Errors from reality check — these are critical issues to address
      asArray(data.errors).slice(0, 6).forEach((e) => {
        const title = str(e);
        if (title) push({ title: truncate(`Fix: ${title}`), priority: "high", category: "strategy" });
      });
      // Warnings from reality check
      asArray(data.warnings).slice(0, 4).forEach((w) => {
        const title = str(w);
        if (title) push({ title: truncate(`Address: ${title}`), priority: "medium", category: "strategy" });
      });
      // Product patch items from reality
      asArray(data.product_patch).slice(0, 5).forEach((p) => {
        const patch = str(p);
        if (patch) push({ title: truncate(`Apply patch: ${patch}`), priority: "high", category: "development" });
      });
      // Decisive move
      const decisiveMove = str(data.decisive_move);
      if (decisiveMove) push({ title: truncate(`Decisive move: ${decisiveMove}`), priority: "high", category: "strategy" });
      // High/critical risk items become mitigation tasks
      asArray(data.risk_items).slice(0, 6).forEach((raw) => {
        const r = asObj(raw);
        const mitigation = str(r.mitigation);
        const assumption = str(r.assumption);
        if (!mitigation) return;
        const sev = str(r.severity);
        if (sev === "critical" || sev === "high") {
          push({
            title: truncate(`Mitigate: ${mitigation}`),
            detail: assumption ? `Assumption at risk: ${assumption}` : undefined,
            priority: sev === "critical" ? "high" : "medium",
            category: "validation",
          });
        }
      });
      // Next actions
      asArray(data.next_actions).slice(0, 4).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(title), priority: "high", category: "strategy" });
      });
      // Blind spots to investigate
      asArray(data.blind_spots).slice(0, 3).forEach((b) => {
        const title = str(b);
        if (title) push({ title: truncate(`Investigate: ${title}`), priority: "medium", category: "validation" });
      });
      break;
    }

    case "proof": {
      // Each planned/running experiment becomes a task
      asArray(data.experiments).slice(0, 8).forEach((raw) => {
        const e = asObj(raw);
        const title = str(e.title);
        const method = str(e.method);
        const successSignal = str(e.success_signal);
        if (!title) return;
        push({
          title: truncate(`Experiment: ${title}`),
          detail: [method, successSignal ? `Success: ${successSignal}` : ""].filter(Boolean).join(" | "),
          priority: normalizePriority(e.effort),
          category: "validation",
        });
      });
      // Evidence gaps are explicit tasks
      asArray(data.evidence_gaps).slice(0, 4).forEach((g) => {
        const gap = str(g);
        if (gap) push({ title: truncate(`Close evidence gap: ${gap}`), priority: "high", category: "validation" });
      });
      // Next experiments
      asArray(data.next_experiments).slice(0, 3).forEach((e) => {
        const title = str(e);
        if (title) push({ title: truncate(`Run: ${title}`), priority: "high", category: "validation" });
      });
      asArray(data.next_actions).slice(0, 3).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(title), priority: "medium", category: "strategy" });
      });
      break;
    }

    case "swarm": {
      // Recommendations as strategy tasks
      asArray(data.recommendations).slice(0, 5).forEach((r) => {
        const title = str(r);
        if (title) push({ title: truncate(title), priority: "high", category: "strategy" });
      });
      // Top objections that are blocking → create rebuttal/fix tasks
      asArray(data.top_objections).slice(0, 4).forEach((raw) => {
        const o = asObj(raw);
        const objection = str(o.objection);
        const rebuttal = str(o.rebuttal);
        const blocking = o.blocking === true || str(o.frequency) === "high";
        if (!objection || !blocking) return;
        push({
          title: truncate(`Address objection: ${objection}`),
          detail: rebuttal ? `Rebuttal: ${rebuttal}` : undefined,
          priority: "high",
          category: "validation",
        });
      });
      // Next experiments
      asArray(data.next_experiments).slice(0, 3).forEach((e) => {
        const title = str(e);
        if (title) push({ title: truncate(`Experiment: ${title}`), priority: "high", category: "validation" });
      });
      // Feature demand items — features customers want built
      asArray(data.feature_demand).slice(0, 5).forEach((f) => {
        const feat = str(f);
        if (feat) push({ title: truncate(`Build (demand): ${feat}`), priority: "high", category: "development" });
      });
      asArray(data.next_actions).slice(0, 3).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(title), priority: "medium", category: "strategy" });
      });
      break;
    }

    case "mvp": {
      // Build-now features are dev tasks
      const scope = asObj(data.ruthless_scope);
      asArray(scope.build_now).slice(0, 8).forEach((f) => {
        const title = str(f);
        if (title) push({ title: truncate(`Build: ${title}`), priority: "high", category: "development" });
      });
      // Architecture decisions as tasks
      asArray(data.architecture).slice(0, 5).forEach((a) => {
        const arch = str(a);
        if (arch) push({ title: truncate(`Architecture: ${arch}`), priority: "high", category: "development" });
      });
      // Feature ROI: only BUILD decisions
      asArray(data.feature_roi).slice(0, 6).forEach((raw) => {
        const f = asObj(raw);
        if (str(f.decision) !== "BUILD") return;
        const title = str(f.feature);
        const reason = str(f.reason);
        if (!title) return;
        const score = typeof f.score === "number" ? f.score : 0;
        push({
          title: truncate(`Build: ${title}`),
          detail: reason || undefined,
          priority: score >= 7 ? "high" : score >= 4 ? "medium" : "low",
          category: "development",
        });
      });
      // Week tasks from the plan
      asArray(data.weeks).slice(0, 4).forEach((raw, weekIndex) => {
        const w = asObj(raw);
        const goal = str(w.goal);
        asArray(w.tasks).slice(0, 4).forEach((t) => {
          const title = str(t);
          if (!title) return;
          push({
            title: truncate(`Week ${weekIndex + 1}: ${title}`),
            detail: goal || undefined,
            priority: weekIndex === 0 ? "high" : "medium",
            category: "development",
          });
        });
      });
      asArray(data.next_actions).slice(0, 3).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(title), priority: "high", category: "strategy" });
      });
      break;
    }

    case "doctor": {
      function appendAC(detail: string, ac?: string[]): string {
        return ac && ac.length > 0 ? `${detail}\nAC: ${ac.join("; ")}`.trim() : detail;
      }

      // RED gates — launch blockers, highest priority
      const gatesData = asArray(data.gates ?? data.launch_gates);
      gatesData.forEach((raw) => {
        const g = asObj(raw);
        const name = str(g.name ?? g.gate);
        const status = str(g.status);
        if (!name || status === "GREEN") return;
        const howToFix = str(g.how_to_fix ?? g.fix);
        const why = str(g.why);
        const evidence = asArray(g.evidence).map((x: unknown) => str(x)).filter(Boolean);
        const detail = [howToFix ? `Fix: ${howToFix}` : "", why ? `Why: ${why}` : "", evidence.length > 0 ? `Evidence: ${evidence.join(", ")}` : ""].filter(Boolean).join(" | ");
        push({
          title: truncate(status === "RED" ? `[BLOCKER] ${name}` : `Fix: ${name}`),
          detail: appendAC(detail, [`${name} gate is GREEN or PASSING`]),
          priority: status === "RED" ? "high" : "medium",
          category: "technical",
        });
      });
      // RED gate names as plain strings (from AI data)
      asArray(data.red_gates).forEach((raw) => {
        if (typeof raw === "string") {
          push({ title: truncate(`[BLOCKER] Resolve: ${raw}`), priority: "high", category: "technical", detail: appendAC("", [`"${raw}" is resolved and gate turns GREEN`]) });
        } else {
          const g = asObj(raw);
          const name = str(g.name ?? g.gate);
          if (!name) return;
          const fix = str(g.how_to_fix ?? g.fix);
          push({
            title: truncate(`[BLOCKER] Resolve: ${name}`),
            detail: appendAC(fix || "", [`${name} gate is GREEN or PASSING`]),
            priority: "high", category: "technical",
          });
        }
      });
      // YELLOW gate names
      asArray(data.yellow_gates).forEach((raw) => {
        if (typeof raw === "string") {
          push({ title: truncate(`Address: ${raw}`), priority: "medium", category: "technical", detail: appendAC("", [`"${raw}" is addressed before launch`]) });
        } else {
          const g = asObj(raw);
          const name = str(g.name ?? g.gate);
          if (!name) return;
          push({
            title: truncate(`Address: ${name}`),
            detail: appendAC(str(g.how_to_fix ?? g.fix) || "", [`${name} gate is YELLOW or GREEN`]),
            priority: "medium", category: "technical",
          });
        }
      });
      // Security findings — always high priority
      asArray(data.security_findings).forEach((raw) => {
        const s = asObj(raw);
        const title = str(s.finding ?? s.issue ?? s.description);
        const fix = str(s.fix ?? s.recommendation);
        const sev = str(s.severity);
        if (!title) return;
        push({
          title: truncate(`[SECURITY] ${title}`),
          detail: appendAC(fix || "Investigate and fix security issue", [`Security issue "${title}" is resolved and verified`]),
          priority: sev === "CRITICAL" || sev === "HIGH" ? "high" : "medium",
          category: "technical",
        });
      });
      // CRITICAL and HIGH issues
      asArray(data.issues).forEach((raw) => {
        const issue = asObj(raw);
        const sev = str(issue.severity);
        if (sev !== "CRITICAL" && sev !== "HIGH") return;
        const title = str(issue.issue);
        const fix = str(issue.fix);
        const filePath = str(issue.file);
        if (!title) return;
        const detailParts = [fix ? `Fix: ${fix}` : ""];
        if (filePath) detailParts.push(`File: ${filePath}`);
        push({
          title: truncate(`Fix: ${title}`),
          detail: appendAC(detailParts.filter(Boolean).join(" | "), fix ? [`${fix} is applied and tested`] : [`${title} is resolved`]),
          priority: sev === "CRITICAL" ? "high" : "medium",
          category: "technical",
        });
      });
      // Repair queue items (ordered, each becomes a task)
      asArray(data.repair_queue).forEach((item, idx) => {
        const title = str(typeof item === "string" ? item : asObj(item).title ?? item);
        if (title) push({ title: truncate(`#${idx + 1} ${title}`), priority: "high", category: "technical", detail: appendAC("", [`Repair item "${title}" is completed`]) });
      });
      // Fix plan items with files and acceptance criteria
      asArray(data.fix_plan).forEach((raw) => {
        const f = asObj(raw);
        const title = str(f.title);
        if (!title) return;
        const files = asArray(f.files).map((x) => str(x)).filter(Boolean);
        const criteria = asArray(f.acceptance_criteria).map((x) => str(x)).filter(Boolean);
        const detailParts: string[] = [];
        if (files.length > 0) detailParts.push(`Files: ${files.join(", ")}`);
        if (str(f.code_hint)) detailParts.push(`Hint: ${str(f.code_hint)}`);
        push({
          title: truncate(title),
          detail: appendAC(detailParts.join(" | "), criteria.length > 0 ? criteria : [`${title} is done and verified`]),
          priority: normalizePriority(f.priority ?? "high"),
          category: "technical",
        });
      });
      // Evidence items from scan (with file paths)
      const evidence = asArray(data.evidence ?? data.evidenceIndex ?? data.scan_evidence);
      evidence.forEach((raw) => {
        const e = asObj(raw);
        const signal = str(e.explanation ?? e.signal ?? e.snippet);
        const filePath = str(e.filePath);
        const sev = str(e.severity);
        if (!signal) return;
        const detailParts = filePath ? [`File: ${filePath}${e.lineNumber ? `:${e.lineNumber}` : ""}`] : [];
        push({
          title: truncate(`${sev === "error" || sev === "CRITICAL" ? "Fix" : "Address"}: ${signal.slice(0, 80)}`),
          detail: appendAC(detailParts.join(" | "), filePath ? [`Issue in ${filePath} is resolved`] : [`${signal} is addressed`]),
          priority: sev === "error" || sev === "CRITICAL" ? "high" : sev === "warning" || sev === "HIGH" ? "medium" : "low",
          category: "technical",
        });
      });
      // Testing gaps
      asArray(data.testing_gaps).forEach((t) => {
        const title = str(typeof t === "string" ? t : asObj(t).gap ?? asObj(t).description ?? t);
        if (title) push({ title: truncate(`[TESTING] ${title}`), priority: "medium", category: "technical", detail: appendAC("", [`Testing gap "${title}" is addressed`]) });
      });
      // Deployment gaps
      asArray(data.deployment_gaps).forEach((d) => {
        const title = str(typeof d === "string" ? d : asObj(d).gap ?? asObj(d).description ?? d);
        if (title) push({ title: truncate(`[DEPLOY] ${title}`), priority: "medium", category: "technical", detail: appendAC("", [`Deployment gap "${title}" is resolved`]) });
      });
      // Codebase alignment tasks
      const alignment = asObj(data.alignment ?? {});
      const alignmentTasks = asArray(alignment.recommendedCodeTasks);
      alignmentTasks.forEach((raw) => {
        const t = asObj(raw);
        const title = str(t.title);
        const reason = str(t.reason);
        if (!title) return;
        push({
          title: truncate(title),
          detail: appendAC(reason || "", [`${title} is done and verified`]),
          priority: normalizePriority(t.priority ?? "medium"),
          category: "technical",
        });
      });
      // Missing product requirements from alignment
      const missingReqs = asArray(alignment.missingProductRequirements);
      missingReqs.forEach((raw) => {
        const m = asObj(raw);
        const title = str(m.title);
        if (!title) return;
        push({
          title: truncate(`[PRODUCT GAP] ${title}`),
          detail: appendAC(str(m.description) || "", [`Product requirement "${title}" is implemented`]),
          priority: "high",
          category: "development",
        });
      });
      // Risky implementation choices from alignment
      const riskyChoices = asArray(alignment.riskyImplementationChoices);
      riskyChoices.forEach((raw) => {
        const r = asObj(raw);
        const title = str(r.title);
        if (!title) return;
        push({
          title: truncate(`[RISK] Address: ${title}`),
          detail: appendAC(str(r.description) || "", [`Risk "${title}" is mitigated`]),
          priority: "medium",
          category: "technical",
        });
      });
      // Critical issues
      asArray(data.critical_issues).forEach((c) => {
        const title = str(c);
        if (title) push({ title: truncate(`[CRITICAL] ${title}`), priority: "high", category: "technical", detail: appendAC("", [`${title} is resolved`]) });
      });
      // Next actions — only when no more specific tasks exist
      if (drafts.length < 3) {
        asArray(data.next_actions).slice(0, 3).forEach((a) => {
          const title = str(a);
          if (title) push({ title: truncate(title), priority: "medium", category: "technical" });
        });
      }
      break;
    }

    case "launch": {
      // Launch checklist — each item is an object {item, category, done, critical}
      asArray(data.launch_checklist).slice(0, 12).forEach((raw) => {
        const item = typeof raw === "string" ? raw : str(asObj(raw).item);
        if (!item) return;
        const obj = typeof raw === "string" ? {} : asObj(raw);
        const isDone = obj.done === true;
        if (isDone) return; // skip already-done items
        const isCritical = obj.critical === true;
        push({
          title: truncate(item),
          priority: isCritical ? "high" : "medium",
          category: str(obj.category) || "launch",
        });
      });
      // Day one actions
      asArray(data.day_one_actions).slice(0, 5).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(`Day 1: ${title}`), priority: "high", category: "launch" });
      });
      // High-probability, high-impact risks need mitigation tasks
      asArray(data.risks).slice(0, 6).forEach((raw) => {
        const r = asObj(raw);
        const risk = str(r.risk ?? r.description);
        const mitigation = str(r.mitigation ?? r.mitigate);
        const probability = str(r.probability ?? r.likelihood);
        const impact = str(r.impact ?? r.severity);
        if (!risk) return;
        if (mitigation) {
          push({
            title: truncate(`Mitigate: ${risk}`),
            detail: mitigation,
            priority: probability === "high" || impact === "high" ? "high" : "medium",
            category: "launch",
          });
        } else {
          push({ title: truncate(`Risk: ${risk}`), priority: "medium", category: "launch" });
        }
      });
      // Distribution channels
      asArray(data.distribution_channels ?? data.channels).slice(0, 4).forEach((c) => {
        const channel = str(c);
        if (channel) push({ title: truncate(`Launch via: ${channel}`), priority: "medium", category: "launch" });
      });
      // Analytics plan
      asArray(data.analytics_plan ?? data.analytics).slice(0, 3).forEach((a) => {
        const item = str(a);
        if (item) push({ title: truncate(`Setup: ${item}`), priority: "medium", category: "launch" });
      });
      // Copy items
      asArray(data.copy ?? data.messaging).slice(0, 3).forEach((c) => {
        const item = str(c);
        if (item) push({ title: truncate(`Copy: ${item}`), priority: "low", category: "launch" });
      });
      asArray(data.next_actions).slice(0, 3).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(title), priority: "high", category: "launch" });
      });
      break;
    }

    case "twin": {
      // Strategic moves
      asArray(data.strategic_moves).slice(0, 5).forEach((m) => {
        const title = str(m);
        if (title) push({ title: truncate(title), priority: "high", category: "strategy" });
      });
      // Drift signals that are high severity need action
      asArray(data.drift_signals).slice(0, 3).forEach((raw) => {
        const d = asObj(raw);
        const signal = str(d.signal);
        if (!signal || str(d.severity) === "low") return;
        push({ title: truncate(`Address drift: ${signal}`), priority: str(d.severity) === "high" ? "high" : "medium", category: "strategy" });
      });
      asArray(data.next_actions).slice(0, 4).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(title), priority: "medium", category: "strategy" });
      });
      break;
    }

    default:
      return 0;
  }

  if (drafts.length === 0) return 0;

  // Deduplicate by title
  const seen = new Set<string>();
  const unique = drafts.filter((d) => {
    const key = d.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  try {
    const saved = await saveTasks(
      unique.map((d) => ({
        title: d.title,
        detail: d.detail,
        priority: d.priority,
        category: d.category,
        sourceReportId: d.sourceReportId,
        projectId: d.projectId ?? undefined,
      })),
    );
    return Array.isArray(saved) ? saved.length : unique.length;
  } catch (e) {
    console.error("Failed to save tasks from report:", e);
    throw new Error(`Task generation failed: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
}

export const createTasksFromReport = generateTasksFromReport;

export function generateSprintFromTasks(
  tasks: Task[],
  options: { title?: string; duration?: number; maxTasksPerDay?: number } = {},
): Sprint {
  const title = options.title || "Sprint Plan";
  const duration = options.duration ?? 14;
  const maxTasksPerDay = options.maxTasksPerDay ?? 3;

  // Sort by priority then category impact
  const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const categoryOrder: Record<string, number> = { technical: 5, development: 4, validation: 3, launch: 2, strategy: 1 };

  const sorted = [...tasks].sort((a, b) => {
    const dp = (priorityOrder[b.priority] ?? 2) - (priorityOrder[a.priority] ?? 2);
    if (dp !== 0) return dp;
    return (categoryOrder[b.category] ?? 0) - (categoryOrder[a.category] ?? 0);
  });

  const totalDays = Math.max(1, Math.ceil(sorted.length / maxTasksPerDay));
  const days: SprintDay[] = [];

  for (let day = 1; day <= totalDays; day++) {
    const slice = sorted.slice((day - 1) * maxTasksPerDay, day * maxTasksPerDay);

    // Build a meaningful goal from the tasks in this day
    const categories = [...new Set(slice.map((t) => t.category))];
    const highPriority = slice.filter((t) => t.priority === "high");
    const goal =
      highPriority.length > 0
        ? `Complete ${highPriority.length} high-priority ${categories.join("/")} task${highPriority.length > 1 ? "s" : ""}`
        : `Complete ${slice.length} ${categories.join("/")} task${slice.length > 1 ? "s" : ""}`;

    days.push({
      day: `Day ${day}`,
      goal,
      tasks: slice.map((t) => t.title),
      acceptance_criteria: slice.map((t) =>
        t.acceptance_criteria?.join("; ") || `"${t.title}" is done and verified`
      ),
    });
  }

  const risks: string[] = [];
  const highPriorityTasks = tasks.filter((t) => t.priority === "high");
  if (highPriorityTasks.length > 5) {
    risks.push(`${highPriorityTasks.length} high-priority tasks — daily re-prioritization recommended`);
  }
  const techTasks = tasks.filter((t) => t.category === "technical");
  if (techTasks.length > 0) {
    risks.push(`${techTasks.length} technical tasks — may expose unknown dependencies that extend the sprint`);
  }
  const launchTasks = tasks.filter((t) => t.category === "launch");
  if (launchTasks.length > 0) {
    risks.push(`${launchTasks.length} launch tasks — external dependencies (DNS, payments, stores) may cause delays`);
  }

  return {
    id: `sprint-${Date.now()}`,
    title,
    days,
    duration,
    maxTasksPerDay,
    risks: risks.slice(0, 5),
    demo_checklist: [
      "All high-priority tasks completed or explicitly deferred with documented reason",
      "Working software demo with real data (not mocked)",
      "Error states tested and handled gracefully",
      "Performance acceptable under real usage patterns",
    ],
  };
}
