import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedUser } from "./auth-middleware";
import { logger } from "./logger";

interface QuotaConfig {
  scansPerDay: number;
  scansTotal: number;
  aiCallsPerDay: number;
  structuredReportsPerDay: number;
  streamingEnabled: boolean;
  maxProjects: number;
}

const PLAN_QUOTAS: Record<string, QuotaConfig> = {
  demo: {
    scansPerDay: 2,
    scansTotal: 2,
    aiCallsPerDay: 5,
    structuredReportsPerDay: 3,
    streamingEnabled: false,
    maxProjects: 2,
  },
  free: {
    scansPerDay: 3,
    scansTotal: 10,
    aiCallsPerDay: 10,
    structuredReportsPerDay: 5,
    streamingEnabled: false,
    maxProjects: 5,
  },
  pro: {
    scansPerDay: 100,
    scansTotal: -1,
    aiCallsPerDay: 200,
    structuredReportsPerDay: 200,
    streamingEnabled: true,
    maxProjects: 50,
  },
  team: {
    scansPerDay: 500,
    scansTotal: -1,
    aiCallsPerDay: 1000,
    structuredReportsPerDay: 1000,
    streamingEnabled: true,
    maxProjects: 200,
  },
  enterprise: {
    scansPerDay: -1,
    scansTotal: -1,
    aiCallsPerDay: -1,
    structuredReportsPerDay: -1,
    streamingEnabled: true,
    maxProjects: -1,
  },
  admin: {
    scansPerDay: -1,
    scansTotal: -1,
    aiCallsPerDay: -1,
    structuredReportsPerDay: -1,
    streamingEnabled: true,
    maxProjects: -1,
  },
};

const USAGE_STORE = new Map<string, Map<string, number>>();

function getDailyKey(userId: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${userId}:${today}`;
}

function getIncrement(key: string, counter: string): number {
  const store = USAGE_STORE.get(key);
  if (!store) return 0;
  return store.get(counter) ?? 0;
}

function increment(key: string, counter: string): void {
  if (!USAGE_STORE.has(key)) {
    USAGE_STORE.set(key, new Map());
  }
  const store = USAGE_STORE.get(key)!;
  store.set(counter, (store.get(counter) ?? 0) + 1);
}

function isUnlimited(val: number): boolean {
  return val === -1;
}

function checkLimit(label: string, current: number, limit: number): string | null {
  if (isUnlimited(limit)) return null;
  if (current >= limit) {
    return `${label} limit reached (${current}/${limit} used)`;
  }
  return null;
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
    if (isUnlimited(limit)) {
      increment(getDailyKey(req.user.id), counter);
      next();
      return;
    }

    const dailyKey = getDailyKey(req.user.id);
    const current = getIncrement(dailyKey, counter);

    const error = checkLimit(counter, current, limit);
    if (error) {
      logger.warn({ userId: req.user.id, plan, counter, current, limit }, "Quota exceeded");
      res.status(429).json({
        error: "QUOTA_EXCEEDED",
        message: error,
        plan,
        limit,
        used: current,
        resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
      });
      return;
    }

    increment(dailyKey, counter);
    next();
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

    const limit = quota.scansPerDay;
    if (!isUnlimited(limit)) {
      const dailyKey = getDailyKey(req.user.id);
      const current = getIncrement(dailyKey, "scan-upload");

      if (current >= limit) {
        logger.warn({ userId: req.user.id, plan, current, limit }, "Scan upload quota exceeded");
        res.status(429).json({
          error: "QUOTA_EXCEEDED",
          message: `Scan upload limit reached (${current}/${limit} per day)`,
          plan,
          limit,
          used: current,
          resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
        });
        return;
      }

      increment(dailyKey, "scan-upload");
    }

    if (!isUnlimited(quota.scansTotal)) {
      const totalKey = `${req.user.id}:total`;
      const total = getIncrement(totalKey, "scan-upload-total");

      if (total >= quota.scansTotal) {
        res.status(429).json({
          error: "QUOTA_EXCEEDED",
          message: `Total scan limit reached (${total}/${quota.scansTotal})`,
          plan,
          limit: quota.scansTotal,
          used: total,
        });
        return;
      }

      increment(totalKey, "scan-upload-total");
    }

    next();
  };
}

export function getCurrentUsage(userId: string, plan: string): Record<string, { used: number; limit: number | string }> {
  const quota = PLAN_QUOTAS[plan];
  const dailyKey = getDailyKey(userId);
  const totalKey = `${userId}:total`;

  const result: Record<string, { used: number; limit: number | string }> = {};

  const numericKeys: (keyof QuotaConfig)[] = ["scansPerDay", "scansTotal", "aiCallsPerDay", "structuredReportsPerDay", "maxProjects"];
  for (const key of numericKeys) {
    const counter = key === "scansPerDay" ? "scan-upload"
      : key === "structuredReportsPerDay" ? "structured"
      : key === "aiCallsPerDay" ? "ai-call"
      : key;

    const used = getIncrement(dailyKey, counter);
    const limit = quota[key] as number;
    result[key] = { used, limit: isUnlimited(limit) ? "unlimited" : limit };
  }

  const totalScansUsed = getIncrement(totalKey, "scan-upload-total");
  result["scansTotal"] = {
    used: totalScansUsed,
    limit: isUnlimited(quota.scansTotal) ? "unlimited" : quota.scansTotal,
  };

  return result;
}
