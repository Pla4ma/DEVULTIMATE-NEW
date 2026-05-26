import { useEffect, Suspense, lazy } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProgressionProvider } from "@/lib/progression-context";

const LandingPage = lazy(() => import("@/pages/landing"));
const PricingPage = lazy(() => import("@/pages/pricing"));
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const NotFound = lazy(() => import("@/pages/not-found"));
const CommandCenterPage = lazy(() => import("@/pages/command-center"));
const IdeaLabPage = lazy(() => import("@/pages/idea-lab"));
const CodeHealthPage = lazy(() => import("@/pages/code-health"));
const BuildPlannerPage = lazy(() => import("@/pages/build-planner"));
const ProjectBrainPage = lazy(() => import("@/pages/project-brain"));
const ReportDetailPage = lazy(() => import("@/pages/report-detail"));
const ProjectDetailPage = lazy(() => import("@/pages/project-detail"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const ROUTE_TITLES: Record<string, string> = {
  "/": "DEVULTIMATE — Ship with evidence, not hope",
  "/app": "Command Center — DEVULTIMATE",
  "/app/idea-lab": "Idea Lab — DEVULTIMATE",
  "/app/code-health": "Code Health — DEVULTIMATE",
  "/app/build": "Build Planner — DEVULTIMATE",
  "/app/brain": "Project Brain — DEVULTIMATE",
  "/pricing": "Pricing — DEVULTIMATE",
  "/privacy": "Privacy — DEVULTIMATE",
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
      document.title = "DEVULTIMATE — Ship with evidence, not hope";
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

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen" style={{ background: "var(--surface-0)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Loading DEVULTIMATE...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/pricing" component={PricingPage} />
        <Route path="/privacy" component={PrivacyPage} />

        <Route path="/app">
          <AuthGuard>
            <CommandCenterPage />
          </AuthGuard>
        </Route>

        <Route path="/app/idea-lab">
          <AuthGuard>
            <IdeaLabPage />
          </AuthGuard>
        </Route>

        <Route path="/app/code-health">
          <AuthGuard>
            <CodeHealthPage />
          </AuthGuard>
        </Route>

        <Route path="/app/build">
          <AuthGuard>
            <BuildPlannerPage />
          </AuthGuard>
        </Route>

        <Route path="/app/brain">
          <AuthGuard>
            <ProjectBrainPage />
          </AuthGuard>
        </Route>

        <Route path="/app/reports/:id">
          <AuthGuard>
            <ReportDetailPage />
          </AuthGuard>
        </Route>

        <Route path="/app/projects/:id">
          <AuthGuard>
            <ProjectDetailPage />
          </AuthGuard>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
