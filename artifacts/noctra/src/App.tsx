import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import LandingPage from "@/pages/landing";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const ROUTE_TITLES: Record<string, string> = {
  "/": "Noctra — Developer Intelligence OS",
  "/app": "Dashboard — Noctra",
  "/app/idea": "Signal Chamber — Noctra",
  "/app/reality": "Pressure Matrix — Noctra",
  "/app/proof": "Proof Reactor — Noctra",
  "/app/swarm": "Swarm Field — Noctra",
  "/app/mvp": "Blueprint Board — Noctra",
  "/app/doctor": "Diagnostic Bay — Noctra",
  "/app/launch": "Launch Control — Noctra",
  "/app/twin": "Memory Constellation — Noctra",
  "/app/passport": "Founder Passport — Noctra",
  "/app/reports": "Reports — Noctra",
  "/app/tasks": "Tasks — Noctra",
  "/app/projects": "Projects — Noctra",
};

function TitleSetter() {
  const [location] = useLocation();
  useEffect(() => {
    // Match exact route first, then check prefixes for detail pages
    const exact = ROUTE_TITLES[location];
    if (exact) {
      document.title = exact;
      return;
    }
    if (location.startsWith("/app/reports/")) {
      document.title = "Report — Noctra";
    } else if (location.startsWith("/app/projects/")) {
      document.title = "Project — Noctra";
    } else {
      document.title = "Noctra — Developer Intelligence OS";
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
    <Switch>
      <Route path="/" component={LandingPage} />
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
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
