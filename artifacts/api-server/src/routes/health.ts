import { Router, type IRouter } from "express";
import { getConfiguredProviders, isAiConfigured, getProviderStatus } from "../lib/ai-client";
import { optionalAuth } from "../lib/auth-middleware";

const router: IRouter = Router();

router.get("/healthz", optionalAuth, (_req, res) => {
  const configured = getConfiguredProviders();
  const primary = configured[0] ?? null;
  const reqUser = (_req as any).user;

  res.json({
    ok: true,
    status: "ok",
    aiConfigured: isAiConfigured(),
    configuredProviders: configured,
    primaryProvider: primary,
    fallbackAvailable: configured.length > 1,
    providerDetails: getProviderStatus(),
    authenticated: !!reqUser,
    userPlan: reqUser?.plan ?? null,
    timestamp: new Date().toISOString(),
  });
});

export default router;
