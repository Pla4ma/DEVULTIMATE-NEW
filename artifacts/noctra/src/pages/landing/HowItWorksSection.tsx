import { useEffect, useRef, useState } from "react";
import { Upload, ScanLine, Wrench, Rocket } from "lucide-react";
import { Appear } from "@/components/Appear";

const STEPS = [
  {
    number: "01",
    icon: Upload,
    title: "Upload your project",
    description: "Drop a ZIP of your codebase. No setup, no configuration files.",
  },
  {
    number: "02",
    icon: ScanLine,
    title: "Run the scan",
    description: "Our diagnostic engine analyzes architecture, dependencies, secrets, and launch blockers in under 2 minutes.",
  },
  {
    number: "03",
    icon: Wrench,
    title: "Get fix prompts",
    description: "Receive prioritized blockers with copy-paste prompts for Cursor, Claude, or Codex. Fix in your IDE.",
  },
  {
    number: "04",
    icon: Rocket,
    title: "Rescan and ship",
    description: "Upload again after fixes. Track your launch readiness score over time. Ship with evidence.",
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const ratio = entry.intersectionRatio;
            const step = Math.min(3, Math.floor(ratio * 4));
            setActiveStep(step);
          }
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="py-[var(--spacing-section)] px-4 sm:px-6"
    >
      <div className="max-w-7xl mx-auto">
        <Appear>
          <p
            className="text-xs font-medium tracking-[0.12em] uppercase mb-4"
            style={{ color: "var(--signal-amber)" }}
          >
            The Loop
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
            Four steps to launch readiness.
          </h2>
        </Appear>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[23px] top-0 bottom-0 w-px bg-void-3 hidden md:block" />
          <div
            className="absolute left-[23px] top-0 w-px hidden md:block transition-all duration-700"
            style={{
              height: `${((activeStep + 1) / STEPS.length) * 100}%`,
              background: "var(--signal-amber)",
            }}
          />

          <div className="space-y-12">
            {STEPS.map((step, i) => (
              <Appear key={step.number} delay={i * 0.1}>
                <div className="flex gap-6 md:gap-8 items-start">
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full border flex items-center justify-center text-lg font-mono font-bold transition-colors duration-500"
                      style={{
                        borderColor:
                          i <= activeStep
                            ? "var(--signal-amber)"
                            : "var(--void-3)",
                        color:
                          i <= activeStep
                            ? "var(--signal-amber)"
                            : "var(--text-quaternary)",
                        background:
                          i <= activeStep ? "var(--signal-amber-dim)" : "var(--void-1)",
                      }}
                    >
                      {step.number}
                    </div>
                  </div>
                  <div className="pt-2">
                    <step.icon
                      size={20}
                      className="mb-3"
                      style={{ color: "var(--text-tertiary)" }}
                    />
                    <h3
                      className="text-xl font-semibold mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed max-w-md"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </Appear>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
