import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Check, X, ArrowRight, HelpCircle, Sparkles, Shield, Globe, Cpu } from "lucide-react";

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
  { question: "What's included in the free tier?", answer: "The free tier gives you 5 AI analyses and 3 codebase scans per month. Perfect for trying out the platform before committing." },
  { question: "Can I upgrade or downgrade anytime?", answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at the end of your billing cycle." },
  { question: "What counts as an analysis?", answer: "Each time you run an intelligence tool (Idea Checker, Project Doctor, Reality Compiler, etc.) it counts as one analysis. Pro and Team plans include hundreds per month." },
  { question: "Is there a trial period?", answer: "Yes! Pro and Team plans come with a 14-day free trial. No credit card required to start. You can explore all features before committing." },
  { question: "Do you offer refunds?", answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact us for a full refund." },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

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
    <div className="min-h-screen" style={{ background: "var(--surface-0)" }}>
      <div className="py-16 px-4 sm:px-6 text-center border-b" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}>
        <motion.div {...fadeInUp}>
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--accent-cyan)" }}>Pricing</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Simple, transparent pricing</h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>Choose the plan that fits your needs. All plans include core features.</p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={`text-sm ${billingCycle === "monthly" ? "font-medium" : ""}`} style={{ color: billingCycle === "monthly" ? "var(--text-primary)" : "var(--text-tertiary)" }}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className="relative w-14 h-7 rounded-full transition-colors"
              style={{ background: billingCycle === "yearly" ? "var(--accent-cyan)" : "var(--surface-2)" }}
            >
              <div className="absolute top-1 w-5 h-5 rounded-full transition-transform" style={{ background: "#fff", left: billingCycle === "yearly" ? "calc(100% - 22px)" : "2px" }} />
            </button>
            <span className={`text-sm ${billingCycle === "yearly" ? "font-medium" : ""}`} style={{ color: billingCycle === "yearly" ? "var(--text-primary)" : "var(--text-tertiary)" }}>Yearly</span>
            {billingCycle === "yearly" && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--color-success-soft)", color: "var(--color-success)" }}>Save 20%</span>
            )}
          </div>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="relative rounded-2xl p-6 transition-all"
              style={{
                background: "var(--surface-1)",
                border: plan.popular ? "2px solid var(--accent-cyan)" : "1px solid var(--border-default)",
                boxShadow: plan.popular ? "0 0 30px var(--accent-cyan-glow)" : "var(--shadow-md)",
              }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "var(--accent-cyan)", color: "#000" }}>Most Popular</span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
                <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>{plan.price}</span>
                {plan.period && <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{plan.period}</span>}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCTA(plan.planId)}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all mb-6"
                style={{
                  background: plan.popular ? "var(--accent-cyan)" : "var(--surface-2)",
                  color: plan.popular ? "#000" : "var(--text-primary)",
                  border: plan.popular ? "none" : "1px solid var(--border-default)",
                }}
              >
                {plan.cta}
              </motion.button>

              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check size={14} style={{ color: "var(--color-success)", flexShrink: 0, marginTop: 2 }} />
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{feature}</span>
                  </div>
                ))}
                {plan.notIncluded.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 opacity-50">
                    <X size={14} style={{ color: "var(--text-quaternary)", flexShrink: 0, marginTop: 2 }} />
                    <span className="text-sm" style={{ color: "var(--text-quaternary)" }}>{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="py-16 px-4 sm:px-6 border-t" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: "var(--text-primary)" }}>Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-default)" }}>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--text-tertiary)" }}>Feature</th>
                  <th className="text-center py-3 px-4 text-sm font-medium" style={{ color: "var(--text-tertiary)" }}>Starter</th>
                  <th className="text-center py-3 px-4 text-sm font-medium" style={{ color: "var(--accent-cyan)" }}>Pro</th>
                  <th className="text-center py-3 px-4 text-sm font-medium" style={{ color: "var(--text-tertiary)" }}>Team</th>
                  <th className="text-center py-3 px-4 text-sm font-medium" style={{ color: "var(--text-tertiary)" }}>Enterprise</th>
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
                  <tr key={row.feature} className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <td className="py-3 px-4 text-sm" style={{ color: "var(--text-secondary)" }}>{row.feature}</td>
                    {(["starter", "pro", "team", "enterprise"] as const).map((tier) => (
                      <td key={tier} className="py-3 px-4 text-center">
                        {typeof row[tier] === "boolean" ? (
                          row[tier] ? <Check size={16} style={{ color: tier === "pro" ? "var(--accent-cyan)" : "var(--color-success)", margin: "0 auto" }} /> : <X size={16} style={{ color: "var(--text-quaternary)", margin: "0 auto" }} />
                        ) : (
                          <span className="text-sm font-medium" style={{ color: tier === "pro" ? "var(--accent-cyan)" : "var(--text-secondary)" }}>{row[tier]}</span>
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

      <div className="py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: "var(--text-primary)" }}>Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border overflow-hidden"
                style={{ background: "var(--surface-1)", borderColor: "var(--border-default)" }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>{faq.question}</span>
                  <HelpCircle size={16} style={{ color: openFaq === i ? "var(--accent-cyan)" : "var(--text-tertiary)" }} />
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
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-20 px-4 sm:px-6 text-center border-t" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Still have questions?</h2>
        <p className="text-lg mb-8" style={{ color: "var(--text-secondary)" }}>Can't find the answer you're looking for? Our team is here to help.</p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-8 py-4 rounded-xl text-base font-semibold"
          style={{ background: "var(--accent-cyan)", color: "#000" }}
        >
          Contact Sales
        </motion.button>
      </div>
    </div>
  );
}
