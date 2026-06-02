import { Radar, ShieldCheck, Activity, ArrowUpRight } from "lucide-react";
import { VoidCard } from "@/components/VoidCard";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { Appear } from "@/components/Appear";

const FEATURES = [
  {
    icon: Radar,
    title: "Signal Chamber",
    description:
      "Validate product ideas with AI scoring. Know if you're building something people want before you write a line of code.",
  },
  {
    icon: ShieldCheck,
    title: "Pressure Matrix",
    description:
      "Stress-test assumptions with a reality compiler. Find the fatal flaws in your thinking before they become fatal flaws in your product.",
  },
  {
    icon: Activity,
    title: "Diagnostic Bay",
    description:
      "Scan your codebase for launch blockers. Upload a ZIP, get a health score, prioritized fixes, and paste-ready prompts.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-[var(--spacing-section)] px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <Appear>
          <p
            className="text-xs font-medium tracking-[0.12em] uppercase mb-4"
            style={{ color: "var(--signal-amber)" }}
          >
            Instruments
          </p>
        </Appear>
        <Appear delay={0.1}>
          <h2
            className="font-bold tracking-tight mb-16"
            style={{
              color: "var(--text-primary)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
            }}
          >
            Point. Scan. Ship.
          </h2>
        </Appear>

        <StaggerContainer className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.title}>
              <VoidCard featured className="h-full flex flex-col">
                <feature.icon
                  size={24}
                  className="mb-6"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <h3
                  className="text-xl font-semibold mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm leading-relaxed flex-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {feature.description}
                </p>
                <div className="mt-6 flex items-center gap-1 text-xs font-medium" style={{ color: "var(--signal-amber)" }}>
                  Learn more <ArrowUpRight size={12} />
                </div>
              </VoidCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
