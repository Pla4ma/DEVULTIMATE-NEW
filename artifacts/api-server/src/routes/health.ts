import { Router, type IRouter } from "express";
import { getConfiguredProviders, isAiConfigured, getProviderStatus } from "../lib/ai-client";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const configured = getConfiguredProviders();
  const primary = configured[0] ?? null;

  res.json({
    ok: true,
    status: "ok",
    aiConfigured: isAiConfigured(),
    configuredProviders: configured,
    primaryProvider: primary,
    fallbackAvailable: configured.length > 1,
    providerDetails: getProviderStatus(),
  });
});

export default router;
