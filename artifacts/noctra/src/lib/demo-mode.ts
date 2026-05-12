const FLAG_KEY = "noctra_demo_mode";
const USER_KEY = "noctra_demo_user";

export const DEMO_USER_FALLBACK_ID = "00000000-0000-0000-0000-000000000001";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.VITE_ENABLE_DEMO_MODE === "true") return true;
  return localStorage.getItem(FLAG_KEY) === "1";
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
