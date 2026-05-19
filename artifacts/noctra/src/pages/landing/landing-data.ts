import { Stethoscope, Brain, ListChecks, Rocket } from "lucide-react";

export const stats = [
  { value: "10K+", label: "Projects Analyzed" },
  { value: "87%", label: "Issue Detection Rate" },
  { value: "4.9", label: "Developer Rating" },
  { value: "< 2min", label: "Avg Scan Time" },
];

export const integrations = [
  { name: "Cursor", icon: "⎔" },
  { name: "Replit", icon: "⏵" },
  { name: "Windsurf", icon: "≋" },
  { name: "VS Code", icon: "⬡" },
  { name: "GitHub", icon: "⎇" },
];

export const testimonials = [
  { quote: "Noctra's Project Doctor found 12 critical launch blockers in my codebase — hardcoded API keys, missing rate limits, no error handling. Fixed everything before shipping. Would have caught a production incident on day one.", author: "Jonathan (Founder)", role: "Built VEX with Noctra" },
  { quote: "The MVP Planner compressed our web app scope from 3 months to 3 weeks. It identified exactly what to cut and what to build first. Shipped on time with half the features we planned — users didn't miss the rest.", author: "Early Builder", role: "Indie Hacker" },
  { quote: "We changed our pricing from $19 to $49/mo based on Noctra's market signal analysis. 3x revenue from day one. The simulation caught a willingness-to-pay gap our own research missed.", author: "Solo Founder", role: "B2B SaaS" },
];

export const features = [
  { icon: Stethoscope, label: "Codebase Diagnosis", desc: "Upload your repo — get launch readiness, red/yellow/green gates, and prioritized fix tasks", color: "var(--noctra-rose)" },
  { icon: Brain, label: "Idea Validation", desc: "Signal score, weak points, assumptions mapped, and the sharpest experiment to run next", color: "var(--noctra-cyan)" },
  { icon: ListChecks, label: "Execution Planning", desc: "From validated idea to prioritized build plan — scope, milestones, and architecture decisions", color: "var(--noctra-violet)" },
  { icon: Rocket, label: "Launch Readiness", desc: "Go/no-go decision, gate verification, and a complete launch checklist before you ship", color: "var(--noctra-emerald)" },
];

export const howItWorks = [
  { step: "01", title: "Input", desc: "Describe your idea or upload your codebase" },
  { step: "02", title: "Analyze", desc: "Noctra scans, scores, and finds gaps across your entire project" },
  { step: "03", title: "Diagnose", desc: "Get a structured report with prioritized fixes and actionable tasks" },
  { step: "04", title: "Ship", desc: "Execute with confidence — all blockers resolved, launch gates green" },
];
