import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import projectsRouter from "./projects";
import usageRouter from "./usage";
import billingRouter from "./billing";
import tasksRouter from "./tasks";
import { requireAuth } from "../lib/auth-middleware";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/ai", requireAuth, aiRouter);
router.use("/projects", requireAuth, projectsRouter);
router.use("/user", requireAuth, usageRouter);
router.use("/billing", billingRouter);
router.use("/tasks", requireAuth, tasksRouter);

export default router;
