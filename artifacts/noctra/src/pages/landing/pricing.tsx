import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles, Zap } from "lucide-react";
import { Magnetic } from "@/components/effects/Magnetic";
import { BeamButton } from "@/components/effects/BeamButton";

const PLANS = [
  {
    name: "Starter",
    tagline: "For solo founders",
    priceMonthly: 29,
    priceYearly: 24,
    description: "Get launch-ready for your first product",
    features: [
      "1 project workspace",
      "5 launch scans / month",
      "AI fix prompts",
      "Email support",
      "All 6 tools included",
    ],
    cta: "Start free",
    popular: false,
  },
  {
    name: "Pro",
    tagline: "For shipping teams",
    priceMonthly: 99,
    priceYearly: 79,
    description: "Ship faster with unlimited scans and rescan loops",
    features: [
      "Unlimited projects",
      "Unlimited scans",
      "Rescan improvement loop",
      "AI Fix Prompts — unlimited",
      "Priority support",
      "Team collaboration (3 seats)",
      "GitHub & Cursor integration",
    ],
    cta: "Start 14-day trial",
    popular: true,
  },
  {
    name: "Scale",
    tagline: "For agencies & teams",
    priceMonthly: 299,
    priceYearly: 239,
    description: "Launch readiness for teams that ship daily",
    features: [
      "Everything in Pro",
      "Unlimited seats",
      "White-label reports",
      "API access & webhooks",
      "Custom AI model training",
      "Dedicated success manager",
      "SSO & advanced security",
    ],
    cta: "Contact sales",
    popular: false,
  },
];

export function Pricing({ onCta }: { onCta: () => void }) {
  const [yearly, setYearly] = useState(true);

  return (
    <section
      id="pricing"
      className="py-28 lg:py-36 relative scroll-anchor"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(168,85,247,0.1) 0%, transparent 60%)",
        }}
      />

      <div className="section-container max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="eyebrow mb-5">Pricing</p>
          <h2
            className="font-bold text-white mb-6 tracking-[-0.04em] leading-[1.02] text-balance"
            style={{ fontSize: "clamp(2.5rem, 5.5vw, 4rem)" }}
          >
            Invest in{" "}
            <span className="text-gradient-aurora">launch readiness</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed mb-10" style={{ color: "#7a7390" }}>
            Start free, scale as you ship. Every plan includes our full AI analysis engine.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl glass-2026">
            <button
              onClick={() => setYearly(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: !yearly ? "rgba(168,85,247,0.15)" : "transparent",
                color: !yearly ? "#e9d5ff" : "#7a7390",
                border: !yearly ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
              style={{
                background: yearly ? "rgba(168,85,247,0.15)" : "transparent",
                color: yearly ? "#e9d5ff" : "#7a7390",
                border: yearly ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
              }}
            >
              Yearly
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
              >
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          {PLANS.map((plan, i) => {
            const price = yearly ? plan.priceYearly : plan.priceMonthly;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`relative ${plan.popular ? "md:-mt-4 md:mb-0" : ""}`}
              >
                {plan.popular ? (
                  <div className="conic-border p-8 h-full flex flex-col">
                    {/* Popular badge */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Magnetic strength={0.15}>
                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase pulse-glow"
                          style={{
                            background: "linear-gradient(135deg, #a855f7 0%, #e879f9 100%)",
                            color: "#03000a",
                            boxShadow: "0 0 30px rgba(168,85,247,0.5)",
                          }}
                        >
                          <Sparkles size={10} />
                          Most Popular
                        </div>
                      </Magnetic>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc" }}>
                          PRO
                        </span>
                      </div>
                      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#c084fc" }}>
                        {plan.tagline}
                      </p>
                      <p className="text-sm" style={{ color: "#b4aec8" }}>
                        {plan.description}
                      </p>
                    </div>

                    <div className="mb-6 flex items-baseline gap-1">
                      <span className="text-6xl font-bold text-white tracking-[-0.04em]">
                        ${price}
                      </span>
                      <span className="text-sm" style={{ color: "#7a7390" }}>
                        /month
                      </span>
                    </div>
                    {yearly && (
                      <p className="text-[10px] font-mono mb-4" style={{ color: "#22c55e" }}>
                        Billed annually · save ${(plan.priceMonthly - plan.priceYearly) * 12}
                      </p>
                    )}

                    <div className="divider-glow mb-6" />

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm" style={{ color: "#b4aec8" }}>
                          <div
                            className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5"
                            style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}
                          >
                            <Check size={11} style={{ color: "#c084fc" }} strokeWidth={3} />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Magnetic strength={0.2}>
                      <BeamButton
                        variant="primary"
                        size="lg"
                        onClick={onCta}
                        className="w-full"
                        iconRight={<ArrowRight size={16} />}
                      >
                        {plan.cta}
                      </BeamButton>
                    </Magnetic>
                  </div>
                ) : (
                  <div
                    className="glass-2026 p-8 h-full flex flex-col transition-all duration-500 hover:border-aurora-500/20"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(26,15,46,0.4) 0%, rgba(10,6,18,0.3) 100%)",
                    }}
                  >
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#7a7390" }}>
                        {plan.tagline}
                      </p>
                      <p className="text-sm" style={{ color: "#b4aec8" }}>
                        {plan.description}
                      </p>
                    </div>

                    <div className="mb-6 flex items-baseline gap-1">
                      <span className="text-6xl font-bold text-white tracking-[-0.04em]">
                        ${price}
                      </span>
                      <span className="text-sm" style={{ color: "#7a7390" }}>
                        /month
                      </span>
                    </div>
                    {yearly && (
                      <p className="text-[10px] font-mono mb-4" style={{ color: "#22c55e" }}>
                        Billed annually
                      </p>
                    )}

                    <div className="divider-glow mb-6" />

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm" style={{ color: "#b4aec8" }}>
                          <div
                            className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                          >
                            <Check size={11} style={{ color: "#7a7390" }} strokeWidth={3} />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <BeamButton
                      variant="secondary"
                      size="lg"
                      onClick={onCta}
                      className="w-full"
                      iconRight={<ArrowRight size={16} />}
                    >
                      {plan.cta}
                    </BeamButton>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Reassurance line */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs mt-12 flex items-center justify-center gap-2"
          style={{ color: "#7a7390" }}
        >
          <Zap size={12} style={{ color: "#c084fc" }} />
          14-day free trial · No credit card · Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
