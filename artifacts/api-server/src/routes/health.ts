import { Router, type IRouter } from "express";
import { getConfiguredProviders, isAiConfigured } from "../lib/ai-client";
import { optionalAuth } from "../lib/auth-middleware";

const router: IRouter = Router();

router.get("/healthz", optionalAuth, (req, res) => {
  const configured = getConfiguredProviders();
  const primary = configured[0] ?? null;

  res.json({
    ok: true,
    status: "ok",
    aiConfigured: isAiConfigured(),
    configuredProviders: configured,
    primaryProvider: primary,
    fallbackAvailable: configured.length > 1,
    authenticated: !!req.user,
    userPlan: req.user?.plan ?? null,
    timestamp: new Date().toISOString(),
  });
});

export default router;
