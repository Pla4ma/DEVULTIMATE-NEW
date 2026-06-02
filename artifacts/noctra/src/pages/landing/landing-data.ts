import { Stethoscope, Brain, ListChecks, Rocket, RotateCcw, Target, CheckSquare, BarChart3 } from "lucide-react";

export const stats = [
  { value: "10K+", label: "Projects Analyzed" },
  { value: "87%", label: "Blocker Detection Rate" },
  { value: "4.9", label: "Developer Rating" },
  { value: "< 2min", label: "Avg Scan to Fix Time" },
];

export const integrations = [
  { name: "Cursor", icon: "⎔" },
  { name: "Replit", icon: "⏵" },
  { name: "Windsurf", icon: "≋" },
  { name: "VS Code", icon: "⬡" },
  { name: "GitHub", icon: "⎇" },
];

export const testimonials = [
  { quote: "NOCTRA found 12 critical launch blockers in my codebase — hardcoded API keys, missing rate limits, no error handling. Fixed everything before shipping. The rescan loop showed my score go from 34 to 89.", author: "Jonathan (Founder)", role: "Built VEX with NOCTRA" },
  { quote: "The scan→fix→rescan loop is a game changer. Each rescan shows my launch readiness score improving as I fix issues. It turns code review into a measurable process.", author: "Early Builder", role: "Indie Hacker" },
  { quote: "We changed our pricing from $19 to $49/mo based on market signal analysis. 3x revenue from day one. The evidence-backed blockers gave us confidence to ship.", author: "Solo Founder", role: "B2B SaaS" },
];

export const features = [
  { icon: Stethoscope, label: "AI Launch Readiness Scan", desc: "Upload your repo — get an evidence-backed launch score, RED/YELLOW/GREEN gates, and prioritized fix tasks", color: "var(--color-danger)" },
  { icon: Target, label: "Blocker Detection", desc: "Every finding includes file-level evidence. Know exactly what blocks launch and where to fix it", color: "var(--color-warning)" },
  { icon: CheckSquare, label: "Fix Task Generation", desc: "Every blocker becomes a prioritized task. Fix, then rescan to verify your score improved", color: "var(--color-success)" },
  { icon: RotateCcw, label: "Rescan Improvement Loop", desc: "Fix → rescan → see your score improve. Track launch readiness over time with every iteration", color: "var(--signal)" },
  { icon: Brain, label: "Idea Validation", desc: "Score ideas for signal strength, red flags, and ICP fit before investing in code", color: "var(--accent-violet)" },
  { icon: Rocket, label: "Launch Workflow", desc: "Idea → MVP → project → scan → fix → rescan → launch. A complete pipeline from concept to shipping", color: "var(--accent-gold)" },
];

export const howItWorks = [
  { step: "01", title: "Scan", desc: "Upload your codebase — get a launch readiness score with evidence-backed blockers" },
  { step: "02", title: "Fix", desc: "Work through the prioritized fix task queue generated from your scan" },
  { step: "03", title: "Rescan", desc: "Upload the fixed codebase — see your score improve as blockers are resolved" },
  { step: "04", title: "Ship", desc: "When all gates are green and your score is launch-ready, ship with confidence" },
];
