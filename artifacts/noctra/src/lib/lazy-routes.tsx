import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Loading...</p>
      </div>
    </div>
  );
}

export function lazyLoad<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): LazyExoticComponent<T> {
  const Component = lazy(factory);
  return Component;
}

export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={fallback ?? <LoadingFallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

export const LazyCommandCenter = lazy(() => import("@/pages/command-center"));
export const LazyIdeaLab = lazy(() => import("@/pages/idea-lab"));
export const LazyCodeHealth = lazy(() => import("@/pages/code-health"));
export const LazyBuildPlanner = lazy(() => import("@/pages/build-planner"));
export const LazyProjectBrain = lazy(() => import("@/pages/project-brain"));
export const LazyLanding = lazy(() => import("@/pages/landing"));
export const LazyPricing = lazy(() => import("@/pages/pricing"));

export const LazyAnalyticsCharts = lazy(() => import("@/components/charts/AnalyticsCharts").then(m => ({ default: m.ScoreTrendChart })));
