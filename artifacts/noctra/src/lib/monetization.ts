// monetization.ts — Monetization intelligence from all report payloads
// Pure utility: no React, no side effects.

import type { ReportSummary } from "./intelligence";

export interface MonetizationIntelligence {
  monetizationScore: number;
  bestModel: string;
  pricingRecommendation: string;
  willingnessToPayEvidence: string;
  paywallStrategy: string;
  freeTierStrategy: string;
  upgradeTriggers: string[];
  revenueRisks: string[];
  experimentsToRun: string[];
  pricingPageCopy: { headline: string; subheadline: string; cta: string };
  monetizationTasks: Array<{ title: string; priority: "critical" | "high" | "medium" }>;
}

function extractData(report: ReportSummary): Record<string, unknown> {
  const p = report.payload as Record<string, unknown> | null;
  if (!p) return {};
  return ((p.data ?? p) as Record<string, unknown>) ?? {};
}

function getScore(report: ReportSummary): number {
  if (typeof report.score === "number") return report.score;
  const d = extractData(report);
  const keys = ["signal_score", "reality_score", "proof_score", "health_score", "mvp_score", "swarm_score", "launch_score", "score"];
  for (const k of keys) {
    if (typeof d[k] === "number") return d[k] as number;
  }
  return 0;
}

export function analyzeMonetization(reports: ReportSummary[]): MonetizationIntelligence {
  const byTool = new Map<string, ReportSummary>();
  for (const r of [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )) {
    if (!byTool.has(r.tool)) byTool.set(r.tool, r);
  }

  const idea = byTool.get("idea");
  const swarm = byTool.get("swarm");
  const mvp = byTool.get("mvp");
  const reality = byTool.get("reality");

  // Extract signals
  const swarmData = swarm ? extractData(swarm) : {};
  const mvpData = mvp ? extractData(mvp) : {};
  const ideaData = idea ? extractData(idea) : {};
  const realityData = reality ? extractData(reality) : {};

  const wtp = typeof swarmData.willingness_to_pay === "number" ? swarmData.willingness_to_pay : null;
  const swarmScore = swarm ? getScore(swarm) : 0;
  const ideaScore = idea ? getScore(idea) : 0;

  const pricingModelRaw = String(mvpData.pricing_model ?? mvpData.monetization ?? idealPricingFromIdea(ideaData));
  const productType = String(ideaData.product_type ?? ideaData.category ?? "SaaS").toLowerCase();

  // Determine best model
  let bestModel = "Freemium with paid tiers";
  let paywallStrategy = "Gate advanced features behind a paid tier after users experience core value";
  let freeTierStrategy = "Free tier includes core functionality with usage limits or feature restrictions";

  if (wtp !== null) {
    if (wtp >= 70) {
      bestModel = "Premium subscription or one-time purchase";
      paywallStrategy = "Lead with pricing — high willingness to pay means users expect to pay for quality";
      freeTierStrategy = "Free trial (14 days) rather than a permanent free tier — converts better when WTP is high";
    } else if (wtp >= 50) {
      bestModel = "Freemium with clear paid upgrade path";
      paywallStrategy = "Show the paid features in the UI but gate access — make upgrade friction-free";
      freeTierStrategy = "Generous free tier that creates habit before asking for payment";
    } else if (wtp >= 30) {
      bestModel = "Free with optional donation or tip jar";
      paywallStrategy = "Avoid hard paywalls — focus on proving value first, monetize after retention";
      freeTierStrategy = "Fully free core product — monetize through premium features, data insights, or B2B upsell";
    } else {
      bestModel = "Free growth → B2B / enterprise monetization";
      paywallStrategy = "Build audience and user base first — monetize through team/enterprise plans, not individual subscriptions";
      freeTierStrategy = "Fully free for individual users — enterprise and team features are the monetization play";
    }
  } else if (pricingModelRaw.includes("b2b") || pricingModelRaw.includes("enterprise")) {
    bestModel = "B2B SaaS with per-seat or usage pricing";
    paywallStrategy = "Per-seat pricing with team collaboration features as the primary paywall trigger";
    freeTierStrategy = "Free for individuals, paid for teams — classic PLG (product-led growth) motion";
  } else if (productType.includes("marketplace") || productType.includes("platform")) {
    bestModel = "Transaction fee or marketplace commission";
    paywallStrategy = "Take a percentage of each transaction rather than a subscription — aligns incentives with user success";
    freeTierStrategy = "Free to list, fee on transaction — zero friction to onboard, monetize at success moment";
  }

  // Pricing recommendation
  const pricingRecommendation = wtp !== null
    ? wtp >= 60
      ? `Charge $29-$99/month for the primary plan. Your simulated market shows ${wtp}% willingness to pay — this validates a premium price point.`
      : wtp >= 40
      ? `Start at $9-$29/month. Willingness to pay at ${wtp}% supports a modest price point with room to grow through proven value.`
      : `Consider a free-first model. With ${wtp}% simulated WTP, charging upfront creates high friction. Prove retention, then introduce pricing.`
    : "Run Market Swarm to simulate willingness-to-pay before committing to a pricing model. Pricing without WTP data is guessing.";

  // Willingness to pay evidence
  const wtpEvidence = wtp !== null
    ? `Market Swarm simulation shows ${wtp}% of simulated users expressed willingness to pay${swarmScore > 0 ? ` (Swarm score: ${swarmScore}/100)` : ""}.`
    : "No willingness-to-pay data collected yet — run Market Swarm and Proof Engine to gather evidence.";

  // Upgrade triggers
  const upgradeTriggers: string[] = [];
  if (wtp !== null && wtp >= 40) {
    upgradeTriggers.push("Usage limit reached — user has extracted enough value to justify payment");
    upgradeTriggers.push("Collaboration request — user tries to invite a team member");
    upgradeTriggers.push("Power feature access — user discovers advanced feature behind paywall");
  } else {
    upgradeTriggers.push("Team or organizational need — individual use is free, team use requires upgrade");
    upgradeTriggers.push("Data export or API access — power users need programmatic access");
    upgradeTriggers.push("Priority support or SLA — enterprise requirement triggers upgrade conversation");
  }
  upgradeTriggers.push("Retention milestone — user has returned 5+ times and is clearly getting value");

  // Revenue risks
  const revenueRisks: string[] = [];
  if (wtp !== null && wtp < 40) {
    revenueRisks.push(`Low simulated WTP (${wtp}%) — pricing above $10/month will face significant resistance`);
  }
  const goSignal = String(realityData.go_signal ?? realityData.compile_status ?? "");
  if (goSignal === "NO-GO" || goSignal === "FAILED") {
    revenueRisks.push("Reality Compiler returned NO-GO — core assumptions that underpin the pricing model may be invalid");
  }
  if (ideaScore < 50 && ideaScore > 0) {
    revenueRisks.push("Weak idea score suggests the value proposition is not strong enough to support significant pricing");
  }
  revenueRisks.push("No proof of payment willingness from real users yet — simulated WTP must be validated with real experiments");
  revenueRisks.push("Pricing too early in product lifecycle before users fully understand the value");

  // Experiments to run
  const experimentsToRun: string[] = [
    "Create a landing page with explicit pricing and measure conversion rate (baseline: ≥ 2% for success)",
    "Run a pricing survey with 10+ target users — ask: 'At what price would this be too expensive? Too cheap? Just right?'",
    "Offer a beta cohort at 50% discount in exchange for honest feedback and testimonials",
    wtp !== null && wtp >= 50
      ? "A/B test monthly vs annual pricing — high WTP users prefer annual for the discount"
      : "Test a 'pay what you want' model to establish a real WTP baseline from actual users",
  ];

  // Pricing page copy
  const ideaTitle = String(ideaData.idea ?? idea?.title ?? "your product");
  const pricingPageCopy = {
    headline: wtp !== null && wtp >= 60
      ? `${ideaTitle.slice(0, 40)} — Trusted by founders who ship`
      : `Start free. Upgrade when you're ready.`,
    subheadline: wtp !== null && wtp >= 50
      ? "Simple, transparent pricing. Cancel any time."
      : "No credit card required. Full access, free.",
    cta: wtp !== null && wtp >= 60 ? "Start your free trial" : "Get started for free",
  };

  // Score
  const monetizationScore = Math.min(
    100,
    Math.max(
      0,
      (wtp ?? 40) * 0.5 +
        (ideaScore > 0 ? ideaScore * 0.2 : 10) +
        (swarmScore > 0 ? swarmScore * 0.15 : 5) +
        (reports.length >= 3 ? 15 : reports.length * 5)
    )
  );

  // Tasks
  const monetizationTasks: MonetizationIntelligence["monetizationTasks"] = [];
  if (!swarm) {
    monetizationTasks.push({ title: "Run Market Swarm to measure simulated willingness to pay", priority: "critical" });
  }
  if (wtp !== null && wtp < 30) {
    monetizationTasks.push({ title: "Redesign value proposition to justify paid pricing", priority: "high" });
  }
  monetizationTasks.push({ title: "Create pricing page with transparent tiers", priority: "high" });
  monetizationTasks.push({ title: "Run 5 pricing interviews with target users", priority: "high" });
  monetizationTasks.push({ title: "Set up conversion tracking on pricing page", priority: "medium" });
  monetizationTasks.push({ title: "Design upgrade flow and paywall UI", priority: "medium" });

  return {
    monetizationScore: Math.round(monetizationScore),
    bestModel,
    pricingRecommendation,
    willingnessToPayEvidence: wtpEvidence,
    paywallStrategy,
    freeTierStrategy,
    upgradeTriggers,
    revenueRisks,
    experimentsToRun,
    pricingPageCopy,
    monetizationTasks,
  };
}

function idealPricingFromIdea(ideaData: Record<string, unknown>): string {
  const text = String(ideaData.idea ?? ideaData.description ?? ideaData.product ?? "").toLowerCase();
  if (text.includes("enterprise") || text.includes("b2b")) return "b2b";
  if (text.includes("marketplace") || text.includes("platform")) return "marketplace";
  if (text.includes("saas") || text.includes("subscription")) return "saas";
  return "unknown";
}
