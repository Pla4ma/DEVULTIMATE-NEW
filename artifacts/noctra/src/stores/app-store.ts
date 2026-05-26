import { create } from "zustand";

export type ExperienceKey = "command" | "idea-lab" | "code-health" | "build" | "brain";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface AppState {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;

  activeExperience: ExperienceKey;
  setActiveExperience: (exp: ExperienceKey) => void;

  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;

  notifications: Notification[];
  addNotification: (n: { title: string; message: string }) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;

  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  theme: "dark",
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),

  activeExperience: "command",
  setActiveExperience: (activeExperience) => set({ activeExperience }),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

  currentProjectId: null,
  setCurrentProjectId: (currentProjectId) => set({ currentProjectId }),

  notifications: [],
  addNotification: (n) => set((s) => ({
    notifications: [
      { id: crypto.randomUUID(), ...n, read: false, created_at: new Date().toISOString() },
      ...s.notifications,
    ].slice(0, 50),
  })),
  markNotificationRead: (id) => set((s) => ({
    notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
  })),
  clearNotifications: () => set({ notifications: [] }),

  onboardingComplete: false,
  setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),

  recentSearches: [],
  addRecentSearch: (query) => set((s) => ({
    recentSearches: [query, ...s.recentSearches.filter((q) => q !== query)].slice(0, 10),
  })),
  clearRecentSearches: () => set({ recentSearches: [] }),
}));
