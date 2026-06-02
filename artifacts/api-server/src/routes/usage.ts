import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth-middleware";
import { getCurrentUsage } from "../lib/usage-quota";

const router: IRouter = Router();

router.get("/usage", requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }

  try {
    const usage = await getCurrentUsage(req.user.id, req.user.plan);
    res.json({
      plan: req.user.plan,
      usage,
    });
  } catch {
    res.status(500).json({ error: "USAGE_ERROR", message: "Failed to load usage" });
  }
});

export default router;
