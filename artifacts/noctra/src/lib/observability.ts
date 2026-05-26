export type AppEvent =
  | "scan_started"
  | "scan_completed"
  | "scan_failed"
  | "ai_report_started"
  | "ai_report_completed"
  | "ai_report_failed"
  | "tasks_generated"
  | "route_404"
  | "billing_checkout_started"
  | "billing_checkout_failed"
  | "upload_rejected"
  | "auth_redirect"
  | "demo_scan_triggered";

export type EventMetadata = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(event: AppEvent, metadata?: EventMetadata): void {
  const logEntry = {
    event,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  if (process.env.NODE_ENV === "development") {
    console.log(`[EVENT] ${event}`, metadata);
  }

  // TODO: Send to analytics service when configured (e.g., PostHog, Mixpanel, Sentry)
}

export function trackScanStarted(projectId?: string): void {
  trackEvent("scan_started", { projectId });
}

export function trackScanCompleted(projectId: string | undefined, duration: number, fileCount: number): void {
  trackEvent("scan_completed", { projectId, duration, fileCount });
}

export function trackScanFailed(projectId: string | undefined, error: string): void {
  trackEvent("scan_failed", { projectId, error });
}

export function trackAiReportStarted(tool: string, projectId?: string): void {
  trackEvent("ai_report_started", { tool, projectId });
}

export function trackAiReportCompleted(tool: string, projectId: string | undefined, duration: number): void {
  trackEvent("ai_report_completed", { tool, projectId, duration });
}

export function trackAiReportFailed(tool: string, error: string): void {
  trackEvent("ai_report_failed", { tool, error });
}
