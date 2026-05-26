import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ROUTES } from "@/lib/routes";
import { Zap, ArrowRight, Stethoscope, Lightbulb, CheckCircle, Rocket, X } from "lucide-react";

const STEPS = [
  {
    title: "Welcome to DEVULTIMATE",
    body: "Your launch readiness platform. Scan your codebase, diagnose blockers, and track improvement — all in one place.",
    icon: "🚀",
    color: "var(--noctra-cyan)",
  },
  {
    title: "Scan any repo",
    body: "Upload a ZIP of your project. We scan for security issues, deployment gaps, missing tests, and code quality problems.",
    icon: "🔍",
    color: "var(--noctra-rose)",
  },
  {
    title: "Get a launch score",
    body: "Every scan produces a launch readiness score (0-100). Red/yellow/green gates show exactly what's blocking launch.",
    icon: "📊",
    color: "var(--noctra-amber)",
  },
  {
    title: "Fix and rescan",
    body: "Each scan generates a prioritized fix queue. Fix the issues, rescan, and watch your score improve.",
    icon: "🔄",
    color: "var(--noctra-emerald)",
  },
  {
    title: "Ready to launch",
    body: "When all gates are green and your score is 70+, you're launch ready. Ship with confidence.",
    icon: "✅",
    color: "var(--noctra-emerald)",
  },
];

const ONBOARDING_KEY = "noctra_onboarding_done_v2";

function isOnboardingDone(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

function markOnboardingDone() {
  localStorage.setItem(ONBOARDING_KEY, "true");
}

export function OnboardingWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isOnboardingDone()) {
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      markOnboardingDone();
      setOpen(false);
      navigate(ROUTES.doctor);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    markOnboardingDone();
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-in" style={{ background: "var(--noctra-surface)", border: "1px solid var(--noctra-border)" }}>
        <div className="px-6 pt-6 pb-4 text-center space-y-4">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl"
            style={{ background: `${current.color}15`, border: `1px solid ${current.color}30` }}
          >
            {current.icon}
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--noctra-text)" }}>{current.title}</h2>
            <p className="text-sm mt-1" style={{ color: "var(--noctra-text-muted)" }}>{current.body}</p>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div className="flex items-center justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-all duration-300" style={{
                background: i === step ? current.color : i < step ? "var(--noctra-emerald)" : "var(--noctra-border2)",
                width: i === step ? 24 : 8,
              }} />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: current.color, color: "#000" }}
          >
            {isLast ? (
              <><CheckCircle size={16} /> Start my first scan</>
            ) : (
              <><ArrowRight size={16} /> Next</>
            )}
          </button>

          {!isLast && (
            <button onClick={handleSkip} className="w-full text-xs py-1 transition-opacity hover:opacity-80" style={{ color: "var(--noctra-text-muted)" }}>
              Skip tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
