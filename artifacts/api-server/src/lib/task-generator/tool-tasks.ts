import type { DraftTask } from "./types";
import { asArray, asObj, str, truncate, normalizePriority } from "./utils";

function appendAC(detail: string, ac?: string[]): string {
  return ac && ac.length > 0 ? `${detail}\nAC: ${ac.join("; ")}`.trim() : detail;
}

export function generateIdeaTasks(data: Record<string, unknown>, push: (t: Omit<DraftTask, "sourceReportId" | "projectId">) => void): void {
  asArray(data.next_actions).slice(0, 6).forEach((a) => {
    const title = str(a);
    if (title) push({ title: truncate(title), priority: "high", category: "strategy", detail: "Generated from Idea Checker analysis" });
  });
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
  asArray(data.errors).slice(0, 4).forEach((e) => {
    const title = str(e);
    if (title) push({ title: truncate(`Fix error: ${title}`), priority: "high", category: "strategy" });
  });
  asArray(data.warnings).slice(0, 4).forEach((w) => {
    const title = str(w);
    if (title) push({ title: truncate(`Address: ${title}`), priority: "medium", category: "strategy" });
  });
  asArray(data.product_patch).slice(0, 3).forEach((p) => {
    const patch = str(p);
    if (patch) push({ title: truncate(`Apply patch: ${patch}`), priority: "high", category: "development" });
  });
  const experiment = str(data.sharpest_experiment);
  if (experiment) {
    push({ title: truncate(`Run: ${experiment}`), detail: "Sharpest experiment from Idea Checker", priority: "high", category: "validation" });
  }
}

export function generateRealityTasks(data: Record<string, unknown>, push: (t: Omit<DraftTask, "sourceReportId" | "projectId">) => void): void {
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
  asArray(data.errors).slice(0, 6).forEach((e) => {
    const title = str(e);
    if (title) push({ title: truncate(`Fix: ${title}`), priority: "high", category: "strategy" });
  });
  asArray(data.warnings).slice(0, 4).forEach((w) => {
    const title = str(w);
    if (title) push({ title: truncate(`Address: ${title}`), priority: "medium", category: "strategy" });
  });
  asArray(data.product_patch).slice(0, 5).forEach((p) => {
    const patch = str(p);
    if (patch) push({ title: truncate(`Apply patch: ${patch}`), priority: "high", category: "development" });
  });
  const decisiveMove = str(data.decisive_move);
  if (decisiveMove) push({ title: truncate(`Decisive move: ${decisiveMove}`), priority: "high", category: "strategy" });
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
  asArray(data.next_actions).slice(0, 4).forEach((a) => {
    const title = str(a);
    if (title) push({ title: truncate(title), priority: "high", category: "strategy" });
  });
  asArray(data.blind_spots).slice(0, 3).forEach((b) => {
    const title = str(b);
    if (title) push({ title: truncate(`Investigate: ${title}`), priority: "medium", category: "validation" });
  });
}

export function generateProofTasks(data: Record<string, unknown>, push: (t: Omit<DraftTask, "sourceReportId" | "projectId">) => void): void {
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
  asArray(data.evidence_gaps).slice(0, 4).forEach((g) => {
    const gap = str(g);
    if (gap) push({ title: truncate(`Close evidence gap: ${gap}`), priority: "high", category: "validation" });
  });
  asArray(data.next_experiments).slice(0, 3).forEach((e) => {
    const title = str(e);
    if (title) push({ title: truncate(`Run: ${title}`), priority: "high", category: "validation" });
  });
  asArray(data.next_actions).slice(0, 3).forEach((a) => {
    const title = str(a);
    if (title) push({ title: truncate(title), priority: "medium", category: "strategy" });
  });
}

export function generateSwarmTasks(data: Record<string, unknown>, push: (t: Omit<DraftTask, "sourceReportId" | "projectId">) => void): void {
  asArray(data.recommendations).slice(0, 5).forEach((r) => {
    const title = str(r);
    if (title) push({ title: truncate(title), priority: "high", category: "strategy" });
  });
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
  asArray(data.next_experiments).slice(0, 3).forEach((e) => {
    const title = str(e);
    if (title) push({ title: truncate(`Experiment: ${title}`), priority: "high", category: "validation" });
  });
  asArray(data.feature_demand).slice(0, 5).forEach((f) => {
    const feat = str(f);
    if (feat) push({ title: truncate(`Build (demand): ${feat}`), priority: "high", category: "development" });
  });
  asArray(data.next_actions).slice(0, 3).forEach((a) => {
    const title = str(a);
    if (title) push({ title: truncate(title), priority: "medium", category: "strategy" });
  });
}

export function generateMvpTasks(data: Record<string, unknown>, push: (t: Omit<DraftTask, "sourceReportId" | "projectId">) => void): void {
  const scope = asObj(data.ruthless_scope);
  asArray(scope.build_now).slice(0, 8).forEach((f) => {
    const title = str(f);
    if (title) push({ title: truncate(`Build: ${title}`), priority: "high", category: "development" });
  });
  asArray(data.architecture).slice(0, 5).forEach((a) => {
    const arch = str(a);
    if (arch) push({ title: truncate(`Architecture: ${arch}`), priority: "high", category: "development" });
  });
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
}

export function generateDoctorTasks(data: Record<string, unknown>, push: (t: Omit<DraftTask, "sourceReportId" | "projectId">) => void, draftCount: () => number): void {
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
  asArray(data.repair_queue).forEach((item, idx) => {
    const title = str(typeof item === "string" ? item : asObj(item).title ?? item);
    if (title) push({ title: truncate(`#${idx + 1} ${title}`), priority: "high", category: "technical", detail: appendAC("", [`Repair item "${title}" is completed`]) });
  });
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
  asArray(data.testing_gaps).forEach((t) => {
    const title = str(typeof t === "string" ? t : asObj(t).gap ?? asObj(t).description ?? t);
    if (title) push({ title: truncate(`[TESTING] ${title}`), priority: "medium", category: "technical", detail: appendAC("", [`Testing gap "${title}" is addressed`]) });
  });
  asArray(data.deployment_gaps).forEach((d) => {
    const title = str(typeof d === "string" ? d : asObj(d).gap ?? asObj(d).description ?? d);
    if (title) push({ title: truncate(`[DEPLOY] ${title}`), priority: "medium", category: "technical", detail: appendAC("", [`Deployment gap "${title}" is resolved`]) });
  });
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
  asArray(data.critical_issues).forEach((c) => {
    const title = str(c);
    if (title) push({ title: truncate(`[CRITICAL] ${title}`), priority: "high", category: "technical", detail: appendAC("", [`${title} is resolved`]) });
  });
  if (draftCount() < 3) {
    asArray(data.next_actions).slice(0, 3).forEach((a) => {
      const title = str(a);
      if (title) push({ title: truncate(title), priority: "medium", category: "technical" });
    });
  }
}

export function generateLaunchTasks(data: Record<string, unknown>, push: (t: Omit<DraftTask, "sourceReportId" | "projectId">) => void): void {
  asArray(data.launch_checklist).slice(0, 12).forEach((raw) => {
    const item = typeof raw === "string" ? raw : str(asObj(raw).item);
    if (!item) return;
    const obj = typeof raw === "string" ? {} : asObj(raw);
    const isDone = obj.done === true;
    if (isDone) return;
    const isCritical = obj.critical === true;
    push({
      title: truncate(item),
      priority: isCritical ? "high" : "medium",
      category: str(obj.category) || "launch",
    });
  });
  asArray(data.day_one_actions).slice(0, 5).forEach((a) => {
    const title = str(a);
    if (title) push({ title: truncate(`Day 1: ${title}`), priority: "high", category: "launch" });
  });
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
  asArray(data.distribution_channels ?? data.channels).slice(0, 4).forEach((c) => {
    const channel = str(c);
    if (channel) push({ title: truncate(`Launch via: ${channel}`), priority: "medium", category: "launch" });
  });
  asArray(data.analytics_plan ?? data.analytics).slice(0, 3).forEach((a) => {
    const item = str(a);
    if (item) push({ title: truncate(`Setup: ${item}`), priority: "medium", category: "launch" });
  });
  asArray(data.copy ?? data.messaging).slice(0, 3).forEach((c) => {
    const item = str(c);
    if (item) push({ title: truncate(`Copy: ${item}`), priority: "low", category: "launch" });
  });
  asArray(data.next_actions).slice(0, 3).forEach((a) => {
    const title = str(a);
    if (title) push({ title: truncate(title), priority: "high", category: "launch" });
  });
}

export function generateTwinTasks(data: Record<string, unknown>, push: (t: Omit<DraftTask, "sourceReportId" | "projectId">) => void): void {
  asArray(data.strategic_moves).slice(0, 5).forEach((m) => {
    const title = str(m);
    if (title) push({ title: truncate(title), priority: "high", category: "strategy" });
  });
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
}
