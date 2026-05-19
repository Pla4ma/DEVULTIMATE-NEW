export const SIGNAL_KINDS = [
  "interview", "waitlist", "signup", "pricing_click", "payment_intent",
  "dm_reply", "demo_request", "objection", "churn_risk", "manual",
];

export const KIND_COLOR: Record<string, string> = {
  interview: "var(--noctra-violet)",
  waitlist: "var(--noctra-amber)",
  signup: "var(--noctra-cyan)",
  pricing_click: "var(--noctra-gold)",
  payment_intent: "var(--noctra-emerald)",
  dm_reply: "var(--noctra-magenta)",
  demo_request: "var(--noctra-cyan)",
  objection: "var(--noctra-rose)",
  churn_risk: "var(--noctra-rose)",
  manual: "var(--noctra-text-muted)",
};
