import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedUser } from "./auth-middleware";
import { logger } from "./logger";
import { getDailyUsage, recordUsage } from "./usage-store";

interface QuotaConfig {
  scansPerDay: number;
  scansTotal: number;
  aiCallsPerDay: number;
  structuredReportsPerDay: number;
  streamingEnabled: boolean;
  maxProjects: number;
}

const PLAN_QUOTAS: Record<string, QuotaConfig> = {
  demo: { scansPerDay: 2, scansTotal: 2, aiCallsPerDay: 5, structuredReportsPerDay: 3, streamingEnabled: false, maxProjects: 2 },
  free: { scansPerDay: 3, scansTotal: 10, aiCallsPerDay: 10, structuredReportsPerDay: 5, streamingEnabled: false, maxProjects: 5 },
  pro: { scansPerDay: 100, scansTotal: -1, aiCallsPerDay: 200, structuredReportsPerDay: 200, streamingEnabled: true, maxProjects: 50 },
  team: { scansPerDay: 500, scansTotal: -1, aiCallsPerDay: 1000, structuredReportsPerDay: 1000, streamingEnabled: true, maxProjects: 200 },
  enterprise: { scansPerDay: -1, scansTotal: -1, aiCallsPerDay: -1, structuredReportsPerDay: -1, streamingEnabled: true, maxProjects: -1 },
  admin: { scansPerDay: -1, scansTotal: -1, aiCallsPerDay: -1, structuredReportsPerDay: -1, streamingEnabled: true, maxProjects: -1 },
};

function isUnlimited(val: number): boolean {
  return val === -1;
}

function clientIp(req: Request): string | undefined {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0]?.trim();
  return req.socket?.remoteAddress ?? undefined;
}

function resetsAt(): string {
  return new Date(new Date().setHours(24, 0, 0, 0)).toISOString();
}

export function requireQuota(counter: string, limitKey: keyof QuotaConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication required" });
      return;
    }

    const plan = req.user.plan;
    const quota = PLAN_QUOTAS[plan];
    if (!quota) {
      res.status(403).json({ error: "QUOTA_ERROR", message: `Unknown plan: ${plan}` });
      return;
    }

    const limit = quota[limitKey] as number;
    const userId = req.user.id;

    if (isUnlimited(limit)) {
      recordUsage(userId, { route: counter, ipAddress: clientIp(req) });
      next();
      return;
    }

    getDailyUsage(userId)
      .then((counts) => {
        const current = counts.get(counter) ?? 0;
        if (current >= limit) {
          logger.warn({ userId, plan, counter, current, limit }, "Quota exceeded");
          res.status(429).json({
            error: "QUOTA_EXCEEDED",
            message: `${counter} limit reached (${current}/${limit} used)`,
            plan, limit, used: current, resetsAt: resetsAt(),
          });
          return;
        }
        recordUsage(userId, { route: counter, ipAddress: clientIp(req) });
        next();
      })
      .catch((err) => {
        logger.error({ userId, err }, "Quota check failed — allowing request (fail-open)");
        recordUsage(userId, { route: counter, ipAddress: clientIp(req) });
        next();
      });
  };
}

export function requirePlan(allowedPlans: AuthenticatedUser["plan"][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication required" });
      return;
    }

    if (!allowedPlans.includes(req.user.plan)) {
      res.status(403).json({
        error: "PLAN_REQUIRED",
        message: `This feature requires ${allowedPlans.join(" or ")} plan`,
        currentPlan: req.user.plan,
      });
      return;
    }

    next();
  };
}

export function requireUploadQuota() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication required" });
      return;
    }

    const plan = req.user.plan;
    const quota = PLAN_QUOTAS[plan];
    if (!quota) {
      res.status(403).json({ error: "QUOTA_ERROR", message: `Unknown plan: ${plan}` });
      return;
    }

    const userId = req.user.id;
    const dailyLimit = quota.scansPerDay;

    if (isUnlimited(dailyLimit)) {
      recordUsage(userId, { route: "scan-upload", ipAddress: clientIp(req) });
      next();
      return;
    }

    getDailyUsage(userId)
      .then((counts) => {
        const current = counts.get("scan-upload") ?? 0;
        if (current >= dailyLimit) {
          logger.warn({ userId, plan, current, limit: dailyLimit }, "Scan upload quota exceeded");
          res.status(429).json({
            error: "QUOTA_EXCEEDED",
            message: `Scan upload limit reached (${current}/${dailyLimit} per day)`,
            plan, limit: dailyLimit, used: current, resetsAt: resetsAt(),
          });
          return;
        }
        recordUsage(userId, { route: "scan-upload", ipAddress: clientIp(req) });
        next();
      })
      .catch((err) => {
        logger.error({ userId, err }, "Scan quota check failed — allowing request (fail-open)");
        recordUsage(userId, { route: "scan-upload", ipAddress: clientIp(req) });
        next();
      });
  };
}

export async function getCurrentUsage(
  userId: string,
  plan: string,
): Promise<Record<string, { used: number; limit: number | string }>> {
  const quota = PLAN_QUOTAS[plan];
  if (!quota) return {};

  const counts = await getDailyUsage(userId);
  const aiCalls = (counts.get("ai-chat") ?? 0) + (counts.get("ai-stream") ?? 0);
  const structured = (counts.get("ai-structured") ?? 0) + (counts.get("ai-insight-sweep") ?? 0);
  const scans = counts.get("scan-upload") ?? 0;

  const fmt = (used: number, limit: number) => ({ used, limit: isUnlimited(limit) ? "unlimited" : limit });

  return {
    scansPerDay: fmt(scans, quota.scansPerDay),
    aiCallsPerDay: fmt(aiCalls, quota.aiCallsPerDay),
    structuredReportsPerDay: fmt(structured, quota.structuredReportsPerDay),
    maxProjects: { used: 0, limit: isUnlimited(quota.maxProjects) ? "unlimited" : quota.maxProjects },
  };
}
