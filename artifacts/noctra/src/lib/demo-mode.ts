const FLAG_KEY = "noctra_demo_mode";
const USER_KEY = "noctra_demo_user";
const WARNED_KEY = "noctra_demo_warned";

export const DEMO_USER_FALLBACK_ID = "00000000-0000-0000-0000-000000000001";

const DEMO_LIMITS = {
  maxReports: 3,
  maxScans: 2,
  maxProjects: 2,
  aiTokensPerCall: 2048,
  noStreaming: true,
  noPersistentData: true,
  sessionOnly: true,
} as const;

export interface DemoLimits {
  maxReports: number;
  maxScans: number;
  maxProjects: number;
  aiTokensPerCall: number;
  noStreaming: boolean;
  noPersistentData: boolean;
  sessionOnly: boolean;
}

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.VITE_ENABLE_DEMO_MODE === "true") return true;
  return localStorage.getItem(FLAG_KEY) === "1";
}

export function getDemoLimits(): DemoLimits {
  return { ...DEMO_LIMITS };
}

export function enableDemoMode(): { id: string; email: string } {
  if (typeof window === "undefined") return { id: DEMO_USER_FALLBACK_ID, email: "demo@noctra.app" };
  let user: { id: string; email: string };
  const existing = localStorage.getItem(USER_KEY);
  if (existing) {
    try { user = JSON.parse(existing); }
    catch { user = { id: crypto.randomUUID(), email: "demo@noctra.app" }; }
  } else {
    user = { id: crypto.randomUUID(), email: "demo@noctra.app" };
  }
  localStorage.setItem(FLAG_KEY, "1");
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function disableDemoMode() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FLAG_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getDemoUser(): { id: string; email: string } | null {
  if (typeof window === "undefined") return null;
  if (!isDemoMode()) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return enableDemoMode();
  try { return JSON.parse(raw); } catch { return enableDemoMode(); }
}

export function isDemoWarned(): boolean {
  return localStorage.getItem(WARNED_KEY) === "1";
}

export function setDemoWarned(): void {
  localStorage.setItem(WARNED_KEY, "1");
}

export function getDemoWarning(): string[] {
  return [
    "Demo mode is for exploration only — not for production use.",
    "Reports and scans are limited (2 scans, 3 reports).",
    "Data is stored locally and may be lost on browser clear.",
    "No sensitive repositories should be uploaded in demo mode.",
    "Sign up for a real account for full features and data persistence.",
  ];
}
