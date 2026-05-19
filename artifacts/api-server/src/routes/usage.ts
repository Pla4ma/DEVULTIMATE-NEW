import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth-middleware";
import { getCurrentUsage } from "../lib/usage-quota";

const router: IRouter = Router();

router.get("/usage", requireAuth, (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }

  const usage = getCurrentUsage(req.user.id, req.user.plan);
  res.json({
    plan: req.user.plan,
    usage,
  });
});

export default router;
