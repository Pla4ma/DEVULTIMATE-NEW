import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, X, ChevronDown } from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { ObsidianButton } from "@/components/ObsidianButton";
import { ObsidianCard } from "@/components/ObsidianCard";

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "For developers just getting started",
    features: [
      "3 AI analyses per month",
      "Basic idea validation",
      "Codebase diagnosis (limited)",
      "Email support",
    ],
    notIncluded: [
      "Unlimited analyses",
      "Advanced market analysis",
      "Team collaboration",
      "Priority processing",
    ],
    cta: "Start Free",
    popular: false,
    planId: "free",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For serious builders and indie hackers",
    features: [
      "200 AI analyses per month",
      "Full intelligence suite access",
      "100 codebase scans per month",
      "Execution plan generation",
      "Priority processing",
      "Export to Markdown",
      "Email & chat support",
      "Unlimited projects",
    ],
    notIncluded: [
      "Team collaboration",
      "Custom integrations",
    ],
    cta: "Start Pro Trial",
    popular: true,
    planId: "pro",
  },
  {
    name: "Team",
    price: "$79",
    period: "/month",
    description: "For small teams building together",
    features: [
      "1000 AI analyses per month",
      "500 codebase scans per month",
      "Up to 5 team members",
      "Shared workspaces",
      "Team analytics dashboard",
      "Collaborative reports",
      "API access",
      "Priority support",
    ],
    notIncluded: [
      "Unlimited team members",
      "Custom integrations",
    ],
    cta: "Start Team Trial",
    popular: false,
    planId: "team",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations at scale",
    features: [
      "Unlimited AI analyses",
      "Unlimited codebase scans",
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
    planId: "enterprise",
  },
];

const faqs = [
  { question: "What's included in the free tier?", answer: "The Starter tier gives you 3 AI analyses and 1 codebase scan per month — enough to run the full readiness loop once and see exactly how NOCTRA works before committing." },
  { question: "Can I upgrade or downgrade anytime?", answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at the end of your billing cycle." },
  { question: "What counts as an analysis?", answer: "Each time you run an intelligence tool (Idea Checker, Project Doctor, Reality Compiler, etc.) it counts as one analysis. Pro and Team plans include hundreds per month." },
  { question: "Is there a trial period?", answer: "Yes! Pro and Team plans come with a 14-day free trial. No credit card required to start. You can explore all features before committing." },
  { question: "Do you offer refunds?", answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact us for a full refund." },
];

export default function PricingPage() {
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  function handleCTA(planId: string) {
    if (planId === "enterprise") {
      window.location.href = "mailto:sales@noctra.app";
      return;
    }
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-obsidian-0">
      <header className="sticky top-0 z-50 border-b border-border-default bg-obsidian-0/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")}><Logo size={28} /></button>
          <button onClick={() => navigate("/")} className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Back to home</button>
        </div>
      </header>

      <div className="py-20 px-4 sm:px-6 text-center border-b border-border-default">
        <p className="eyebrow mb-4 text-signal">Pricing</p>
        <h1 className="font-bold tracking-tight mb-4 text-text-primary" style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)" }}>Pick your altitude.</h1>
        <p className="text-lg max-w-2xl mx-auto text-text-secondary">Every plan includes the full readiness loop. Scale scans and seats as you ship more.</p>

        <div className="mt-9 inline-flex items-center gap-3 p-1.5 rounded-full bg-obsidian-2 border border-border-default">
          <button
            onClick={() => setBillingCycle("monthly")}
            className="text-sm px-4 py-1.5 rounded-full transition-all"
            style={{ background: billingCycle === "monthly" ? "var(--signal)" : "transparent", color: billingCycle === "monthly" ? "var(--obsidian-0)" : "var(--text-tertiary)", fontWeight: billingCycle === "monthly" ? 600 : 400 }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className="text-sm px-4 py-1.5 rounded-full transition-all inline-flex items-center gap-2"
            style={{ background: billingCycle === "yearly" ? "var(--signal)" : "transparent", color: billingCycle === "yearly" ? "var(--obsidian-0)" : "var(--text-tertiary)", fontWeight: billingCycle === "yearly" ? 600 : 400 }}
          >
            Yearly
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: billingCycle === "yearly" ? "var(--obsidian-0)" : "rgba(52,211,153,0.12)", color: billingCycle === "yearly" ? "var(--signal)" : "var(--color-success)" }}>-20%</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => {
            const monthly = Number(String(plan.price).replace("$", ""));
            const hasNumericPrice = !Number.isNaN(monthly) && monthly > 0;
            const displayPrice = hasNumericPrice
              ? (billingCycle === "yearly" ? `$${Math.round(monthly * 0.8)}` : plan.price)
              : plan.price;
            const displayPeriod = hasNumericPrice ? "/mo" : plan.period;
            return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="relative"
            >
              <ObsidianCard
                className={cn("h-full", plan.popular && "border-signal/30")}
                hover={true}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-medium tracking-[0.12em] uppercase px-3 py-1 rounded-full bg-signal-amber text-black">Most Popular</span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
                  <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>{plan.description}</p>
                </div>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>{displayPrice}</span>
                  {displayPeriod && <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{displayPeriod}</span>}
                  {hasNumericPrice && billingCycle === "yearly" && (
                    <span className="font-mono text-[10px] ml-1.5 px-1.5 py-0.5 rounded" style={{ background: "var(--color-success-soft)", color: "var(--color-success)" }}>billed yearly</span>
                  )}
                </div>

                <ObsidianButton
                  variant={plan.popular ? "primary" : "secondary"}
                  className="w-full mb-6"
                  onClick={() => handleCTA(plan.planId)}
                >
                  {plan.cta}
                </ObsidianButton>

                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5">
                      <Check size={15} style={{ color: "var(--signal-amber)", flexShrink: 0, marginTop: 2 }} />
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{feature}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5 opacity-45">
                      <X size={15} style={{ color: "var(--text-quaternary)", flexShrink: 0, marginTop: 2 }} />
                      <span className="text-sm line-through" style={{ color: "var(--text-quaternary)" }}>{feature}</span>
                    </div>
                  ))}
                </div>
              </ObsidianCard>
            </motion.div>
            );
          })}
        </div>
      </div>

      <div className="py-16 px-4 sm:px-6 border-t border-void-3 bg-void-1 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: "var(--text-primary)" }}>Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-void-3">
                  <th className="text-left py-3 px-4 text-xs font-medium tracking-[0.12em] uppercase" style={{ color: "var(--text-tertiary)" }}>Feature</th>
                  <th className="text-center py-3 px-4 text-xs font-medium tracking-[0.12em] uppercase" style={{ color: "var(--text-tertiary)" }}>Starter</th>
                  <th className="text-center py-3 px-4 text-xs font-medium tracking-[0.12em] uppercase" style={{ color: "var(--signal-amber)" }}>Pro</th>
                  <th className="text-center py-3 px-4 text-xs font-medium tracking-[0.12em] uppercase" style={{ color: "var(--text-tertiary)" }}>Team</th>
                  <th className="text-center py-3 px-4 text-xs font-medium tracking-[0.12em] uppercase" style={{ color: "var(--text-tertiary)" }}>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Monthly analyses", starter: "3", pro: "200", team: "1000", enterprise: "Unlimited" },
                  { feature: "Codebase scans/mo", starter: "1", pro: "100", team: "500", enterprise: "Unlimited" },
                  { feature: "Idea validation", starter: true, pro: true, team: true, enterprise: true },
                  { feature: "Codebase diagnosis", starter: true, pro: true, team: true, enterprise: true },
                  { feature: "Execution plans", starter: false, pro: true, team: true, enterprise: true },
                  { feature: "Market analysis", starter: false, pro: true, team: true, enterprise: true },
                  { feature: "Priority processing", starter: false, pro: true, team: true, enterprise: true },
                  { feature: "Team members", starter: "1", pro: "1", team: "5", enterprise: "Unlimited" },
                  { feature: "Shared workspaces", starter: false, pro: false, team: true, enterprise: true },
                  { feature: "API access", starter: false, pro: false, team: true, enterprise: true },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-void-3">
                    <td className="py-3 px-4 text-sm" style={{ color: "var(--text-secondary)" }}>{row.feature}</td>
                    {(["starter", "pro", "team", "enterprise"] as const).map((tier) => (
                      <td key={tier} className="py-3 px-4 text-center">
                        {typeof row[tier] === "boolean" ? (
                          row[tier] ? <Check size={16} style={{ color: tier === "pro" ? "var(--signal-amber)" : "var(--color-success)", margin: "0 auto" }} /> : <X size={16} style={{ color: "var(--text-quaternary)", margin: "0 auto" }} />
                        ) : (
                          <span className="text-sm font-medium font-mono" style={{ color: tier === "pro" ? "var(--signal-amber)" : "var(--text-secondary)" }}>{row[tier]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="py-16 px-4 sm:px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: "var(--text-primary)" }}>Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border overflow-hidden bg-void-1"
                style={{ borderColor: openFaq === i ? "var(--signal-amber)" : "var(--void-3)" }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-4 text-left"
                >
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>{faq.question}</span>
                  <motion.span animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
                    <ChevronDown size={17} style={{ color: openFaq === i ? "var(--signal-amber)" : "var(--text-tertiary)" }} />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-20 px-4 sm:px-6 text-center border-t border-void-3 relative overflow-hidden bg-void-1">
        <div className="relative z-10">
          <div className="flex justify-center mb-5"><LogoMark size={40} animated /></div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Still charting your launch?</h2>
          <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>Tell us what you're building and we'll help you find the right altitude.</p>
          <ObsidianButton
            variant="primary"
            size="lg"
            onClick={() => { window.location.href = "mailto:sales@noctra.app"; }}
          >
            Contact Sales
          </ObsidianButton>
        </div>
      </div>
    </div>
  );
}
