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
  | "auth_redirect";

export function trackEvent(event: AppEvent, metadata?: Record<string, unknown>): void {
  console.log(JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    ...metadata,
  }));
}
