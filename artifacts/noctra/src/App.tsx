import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProgressionProvider } from "@/lib/progression-context";
import { CommandPalette } from "@/components/CommandPalette";

import LandingPage from "@/pages/landing";
import PricingPage from "@/pages/pricing";
import DashboardPage from "@/pages/dashboard";
import IdeaPage from "@/pages/idea";
import RealityPage from "@/pages/reality";
import MvpPage from "@/pages/mvp";
import ProofPage from "@/pages/proof";
import SwarmPage from "@/pages/swarm";
import DoctorPage from "@/pages/doctor";
import LaunchPage from "@/pages/launch";
import TwinPage from "@/pages/twin";
import PassportPage from "@/pages/passport";
import ReportsPage from "@/pages/reports";
import ReportDetailPage from "@/pages/report-detail";
import TasksPage from "@/pages/tasks";
import ProjectsPage from "@/pages/projects";
import ProjectDetailPage from "@/pages/project-detail";
import NotFound from "@/pages/not-found";
import PrivacyPage from "@/pages/privacy";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const ROUTE_TITLES: Record<string, string> = {
  "/": "DEVULTIMATE — AI Launch Readiness Platform",
  "/app": "Launch Cockpit — DEVULTIMATE",
  "/app/idea": "Idea Checker — DEVULTIMATE",
  "/app/reality": "Reality Compiler — DEVULTIMATE",
  "/app/proof": "Proof Engine — DEVULTIMATE",
  "/app/swarm": "Market Swarm — DEVULTIMATE",
  "/app/mvp": "MVP Planner — DEVULTIMATE",
  "/app/doctor": "Product Doctor — DEVULTIMATE",
  "/app/launch": "Launch Room — DEVULTIMATE",
  "/app/twin": "Product Twin — DEVULTIMATE",
  "/app/passport": "Project Profile — DEVULTIMATE",
  "/app/reports": "Reports — DEVULTIMATE",
  "/app/tasks": "Fix Tasks — DEVULTIMATE",
  "/app/projects": "Projects — DEVULTIMATE",
};

function TitleSetter() {
  const [location] = useLocation();
  useEffect(() => {
    const exact = ROUTE_TITLES[location];
    if (exact) {
      document.title = exact;
      return;
    }
    if (location.startsWith("/app/reports/")) {
      document.title = "Report — DEVULTIMATE";
    } else if (location.startsWith("/app/projects/")) {
      document.title = "Project — DEVULTIMATE";
    } else {
      document.title = "DEVULTIMATE — AI Launch Readiness Platform";
    }
  }, [location]);
  return null;
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function AppRoutes() {
  return (
    <>
      <CommandPalette />
      <OnboardingWizard />
      <Switch>
<Route path="/" component={LandingPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/app">
          <AuthGuard>
            <DashboardPage />
          </AuthGuard>
        </Route>
      <Route path="/app/idea">
        <AuthGuard><IdeaPage /></AuthGuard>
      </Route>
      <Route path="/app/reality">
        <AuthGuard><RealityPage /></AuthGuard>
      </Route>
      <Route path="/app/mvp">
        <AuthGuard><MvpPage /></AuthGuard>
      </Route>
      <Route path="/app/proof">
        <AuthGuard><ProofPage /></AuthGuard>
      </Route>
      <Route path="/app/swarm">
        <AuthGuard><SwarmPage /></AuthGuard>
      </Route>
      <Route path="/app/doctor">
        <AuthGuard><DoctorPage /></AuthGuard>
      </Route>
      <Route path="/app/launch">
        <AuthGuard><LaunchPage /></AuthGuard>
      </Route>
      <Route path="/app/twin">
        <AuthGuard><TwinPage /></AuthGuard>
      </Route>
      <Route path="/app/passport">
        <AuthGuard><PassportPage /></AuthGuard>
      </Route>
      <Route path="/app/reports/:id">
        <AuthGuard><ReportDetailPage /></AuthGuard>
      </Route>
      <Route path="/app/reports">
        <AuthGuard><ReportsPage /></AuthGuard>
      </Route>
      <Route path="/app/tasks">
        <AuthGuard><TasksPage /></AuthGuard>
      </Route>
      <Route path="/app/projects/:id">
        <AuthGuard><ProjectDetailPage /></AuthGuard>
      </Route>
      <Route path="/app/projects">
        <AuthGuard><ProjectsPage /></AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProgressionProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <TitleSetter />
              <ScrollToTop />
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </ProgressionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
