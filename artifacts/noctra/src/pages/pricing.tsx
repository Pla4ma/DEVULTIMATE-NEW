import { useState } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Primitives";
import { Zap, Check, X, ArrowRight, Users, Building2, Rocket, Star, HelpCircle } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "For developers just getting started",
    features: [
      "5 AI analyses per month",
      "Basic idea validation",
      "Simple codebase诊断",
      "Email support",
    ],
    notIncluded: [
      "Advanced market analysis",
      "Team collaboration",
      "Priority processing",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For serious builders and indie hackers",
    features: [
      "Unlimited AI analyses",
      "Full intelligence suite access",
      "Codebase ZIP upload & analysis",
      "Execution plan generation",
      "Priority processing",
      "Export to Markdown",
      "Email & chat support",
    ],
    notIncluded: [
      "Team collaboration",
      "Custom integrations",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Team",
    price: "$79",
    period: "/month",
    description: "For small teams building together",
    features: [
      "Everything in Pro",
      "Up to 5 team members",
      "Shared workspaces",
      "Team analytics dashboard",
      "Collaborative reports",
      "Team command palette",
      "API access",
      "Priority support",
    ],
    notIncluded: [
      "Unlimited team members",
      "Custom integrations",
    ],
    cta: "Start Team Trial",
    popular: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations at scale",
    features: [
      "Everything in Team",
      "Unlimited team members",
      "Custom integrations",
      "SLA guarantees",
      "Dedicated success manager",
      "On-premise deployment options",
      "Advanced security & compliance",
      "Custom training",
    ],
    notIncluded: [],
    cta: "Contact Sales",
    popular: false,
  },
];

const faqs = [
  {
    question: "What's included in the free tier?",
    answer: "The free tier gives you 5 AI analyses per month with access to basic idea validation and simple codebase diagnostics. Perfect for trying out the platform.",
  },
  {
    question: "Can I upgrade or downgrade anytime?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at the end of your billing cycle.",
  },
  {
    question: "What counts as an analysis?",
    answer: "Each time you run an intelligence tool (Idea Checker, Project Doctor, Reality Compiler, etc.) it counts as one analysis. Pro and Team plans include unlimited analyses.",
  },
  {
    question: "Is there a trial period?",
    answer: "Yes! Pro and Team plans come with a 14-day free trial. No credit card required to start. You can explore all features before committing.",
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact us for a full refund.",
  },
];

export default function PricingPage() {
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <AppShell>
      <div className="min-h-screen" style={{ background: "var(--noctra-bg)" }}>
        {/* Header */}
        <div className="py-16 px-6 text-center border-b" style={{ borderColor: "var(--noctra-border)", background: "var(--noctra-surface)" }}>
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--noctra-cyan)" }}>Pricing</p>
          <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--noctra-text)" }}>
            Simple, transparent pricing
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--noctra-text-soft)" }}>
            Choose the plan that fits your needs. All plans include core features.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={`text-sm ${billingCycle === "monthly" ? "font-medium" : ""}`} style={{ color: billingCycle === "monthly" ? "var(--noctra-text)" : "var(--noctra-text-muted)" }}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className="relative w-14 h-7 rounded-full transition-colors"
              style={{ background: billingCycle === "yearly" ? "var(--noctra-cyan)" : "var(--noctra-surface2)" }}
            >
              <div
                className="absolute top-1 w-5 h-5 rounded-full transition-transform"
                style={{
                  background: "#fff",
                  left: billingCycle === "yearly" ? "calc(100% - 22px)" : "2px",
                }}
              />
            </button>
            <span className={`text-sm ${billingCycle === "yearly" ? "font-medium" : ""}`} style={{ color: billingCycle === "yearly" ? "var(--noctra-text)" : "var(--noctra-text-muted)" }}>
              Yearly
            </span>
            {billingCycle === "yearly" && (
              <Badge style={{ background: "rgba(52,211,153,0.15)", color: "var(--noctra-emerald)", fontSize: "10px" }}>
                Save 20%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="relative rounded-2xl p-6 transition-all hover:scale-[1.02]"
                style={{
                  background: "var(--noctra-surface)",
                  border: plan.popular ? "2px solid var(--noctra-cyan)" : "1px solid var(--noctra-border)",
                  boxShadow: plan.popular ? "0 0 30px rgba(61,216,255,0.15)" : "none",
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "var(--noctra-cyan)", color: "#000" }}>
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-bold" style={{ color: "var(--noctra-text)" }}>{plan.name}</h3>
                  <p className="text-sm mt-1" style={{ color: "var(--noctra-text-muted)" }}>{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold" style={{ color: "var(--noctra-text)" }}>{plan.price}</span>
                  {plan.period && <span className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>{plan.period}</span>}
                </div>

                <button
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 mb-6"
                  style={{
                    background: plan.popular ? "var(--noctra-cyan)" : "var(--noctra-surface2)",
                    color: plan.popular ? "#000" : "var(--noctra-text)",
                    border: plan.popular ? "none" : "1px solid var(--noctra-border)",
                  }}
                >
                  {plan.cta}
                </button>

                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check size={14} style={{ color: "var(--noctra-emerald)", flexShrink: 0, marginTop: 2 }} />
                      <span className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{feature}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 opacity-50">
                      <X size={14} style={{ color: "var(--noctra-text-muted)", flexShrink: 0, marginTop: 2 }} />
                      <span className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature comparison */}
        <div className="py-16 px-6 border-t" style={{ borderColor: "var(--noctra-border)", background: "var(--noctra-surface)" }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10" style={{ color: "var(--noctra-text)" }}>
              Feature Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--noctra-border)" }}>
                    <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--noctra-text-muted)" }}>Feature</th>
                    <th className="text-center py-3 px-4 text-sm font-medium" style={{ color: "var(--noctra-text-muted)" }}>Starter</th>
                    <th className="text-center py-3 px-4 text-sm font-medium" style={{ color: "var(--noctra-cyan)" }}>Pro</th>
                    <th className="text-center py-3 px-4 text-sm font-medium" style={{ color: "var(--noctra-text-muted)" }}>Team</th>
                    <th className="text-center py-3 px-4 text-sm font-medium" style={{ color: "var(--noctra-text-muted)" }}>Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Monthly analyses", starter: "5", pro: "Unlimited", team: "Unlimited", enterprise: "Unlimited" },
                    { feature: "Idea validation", starter: true, pro: true, team: true, enterprise: true },
                    { feature: "Codebase diagnosis", starter: true, pro: true, team: true, enterprise: true },
                    { feature: "Execution plans", starter: false, pro: true, team: true, enterprise: true },
                    { feature: "Market analysis", starter: false, pro: true, team: true, enterprise: true },
                    { feature: "Priority processing", starter: false, pro: true, team: true, enterprise: true },
                    { feature: "Team members", starter: "1", pro: "1", team: "5", enterprise: "Unlimited" },
                    { feature: "Shared workspaces", starter: false, pro: false, team: true, enterprise: true },
                    { feature: "API access", starter: false, pro: false, team: true, enterprise: true },
                    { feature: "Custom integrations", starter: false, pro: false, team: false, enterprise: true },
                  ].map((row) => (
                    <tr key={row.feature} className="border-b" style={{ borderColor: "var(--noctra-border)" }}>
                      <td className="py-3 px-4 text-sm" style={{ color: "var(--noctra-text-soft)" }}>{row.feature}</td>
                      <td className="py-3 px-4 text-center">
                        {typeof row.starter === "boolean" ? (
                          row.starter ? <Check size={16} style={{ color: "var(--noctra-emerald)", margin: "0 auto" }} /> : <X size={16} style={{ color: "var(--noctra-text-muted)", margin: "0 auto" }} />
                        ) : (
                          <span className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>{row.starter}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {typeof row.pro === "boolean" ? (
                          row.pro ? <Check size={16} style={{ color: "var(--noctra-cyan)", margin: "0 auto" }} /> : <X size={16} style={{ color: "var(--noctra-text-muted)", margin: "0 auto" }} />
                        ) : (
                          <span className="text-sm font-medium" style={{ color: "var(--noctra-cyan)" }}>{row.pro}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {typeof row.team === "boolean" ? (
                          row.team ? <Check size={16} style={{ color: "var(--noctra-emerald)", margin: "0 auto" }} /> : <X size={16} style={{ color: "var(--noctra-text-muted)", margin: "0 auto" }} />
                        ) : (
                          <span className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>{row.team}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {typeof row.enterprise === "boolean" ? (
                          row.enterprise ? <Check size={16} style={{ color: "var(--noctra-emerald)", margin: "0 auto" }} /> : <X size={16} style={{ color: "var(--noctra-text-muted)", margin: "0 auto" }} />
                        ) : (
                          <span className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>{row.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10" style={{ color: "var(--noctra-text)" }}>
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-xl border overflow-hidden"
                  style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="font-medium" style={{ color: "var(--noctra-text)" }}>{faq.question}</span>
                    <HelpCircle size={16} style={{ color: openFaq === i ? "var(--noctra-cyan)" : "var(--noctra-text-muted)" }} />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4">
                      <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="py-20 px-6 text-center border-t" style={{ borderColor: "var(--noctra-border)", background: "var(--noctra-surface)" }}>
          <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--noctra-text)" }}>Still have questions?</h2>
          <p className="text-lg mb-8" style={{ color: "var(--noctra-text-soft)" }}>
            Can't find the answer you're looking for? Our team is here to help.
          </p>
          <button
            className="px-8 py-4 rounded-xl text-base font-semibold"
            style={{ background: "var(--noctra-cyan)", color: "#000" }}
          >
            Contact Sales
          </button>
        </div>
      </div>
    </AppShell>
  );
}