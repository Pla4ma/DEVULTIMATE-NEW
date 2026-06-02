import { useState, useCallback, useEffect } from "react";
import { useAppStore } from "@/stores/app-store";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to NOCTRA",
    description: "Your AI-powered launch intelligence platform. Let's get you started in under 2 minutes.",
  },
  {
    id: "command-center",
    title: "Command Center",
    description: "This is your launch readiness dashboard. See your score, blockers, and next actions at a glance.",
    target: '[data-onboarding="command-center"]',
  },
  {
    id: "idea-lab",
    title: "Idea Lab",
    description: "Validate ideas, stress-test assumptions, and simulate market demand — all in one place.",
    target: '[data-onboarding="idea-lab"]',
  },
  {
    id: "code-health",
    title: "Code Health",
    description: "Upload your codebase and get a launch readiness score with actionable fix tasks.",
    target: '[data-onboarding="code-health"]',
  },
  {
    id: "build-planner",
    title: "Build Planner",
    description: "Plan your MVP scope and track execution with AI-generated task breakdowns.",
    target: '[data-onboarding="build-planner"]',
  },
  {
    id: "project-brain",
    title: "Project Brain",
    description: "Your persistent AI memory. Ask questions about your project and get insights from all your data.",
    target: '[data-onboarding="project-brain"]',
  },
  {
    id: "complete",
    title: "You're ready!",
    description: "Start by describing your idea or uploading your codebase. NOCTRA will guide you from there.",
  },
];

export function useOnboarding() {
  const { onboardingComplete, setOnboardingComplete } = useAppStore();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const startOnboarding = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsActive(false);
      setOnboardingComplete(true);
    }
  }, [currentStep, setOnboardingComplete]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skipOnboarding = useCallback(() => {
    setIsActive(false);
    setOnboardingComplete(true);
  }, [setOnboardingComplete]);

  const resetOnboarding = useCallback(() => {
    setOnboardingComplete(false);
    setCurrentStep(0);
    setIsActive(false);
  }, [setOnboardingComplete]);

  useEffect(() => {
    if (!onboardingComplete && !isActive) {
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1000);
      return () => { clearTimeout(timer); };
    }
    return undefined;
  }, [onboardingComplete, isActive, startOnboarding]);

  return {
    isActive,
    currentStep,
    steps: ONBOARDING_STEPS,
    currentStepData: ONBOARDING_STEPS[currentStep],
    totalSteps: ONBOARDING_STEPS.length,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === ONBOARDING_STEPS.length - 1,
    startOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
    resetOnboarding,
    onboardingComplete,
  };
}
