export const SIGNAL_KINDS = [
  "interview", "waitlist", "signup", "pricing_click", "payment_intent",
  "dm_reply", "demo_request", "objection", "churn_risk", "manual",
];

export const KIND_COLOR: Record<string, string> = {
  interview: "var(--accent-violet)",
  waitlist: "var(--color-warning)",
  signup: "var(--signal)",
  pricing_click: "var(--accent-gold)",
  payment_intent: "var(--color-success)",
  dm_reply: "var(--accent-magenta)",
  demo_request: "var(--signal)",
  objection: "var(--color-danger)",
  churn_risk: "var(--color-danger)",
  manual: "var(--text-tertiary)",
};
