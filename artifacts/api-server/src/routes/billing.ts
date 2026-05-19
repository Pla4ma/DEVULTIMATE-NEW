import { Router, type IRouter } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { logger } from "../lib/logger";
import { updateUserPlan } from "../lib/supabase-admin";

const router: IRouter = Router();

function verifyStripeSignature(payload: string, sig: string, secret: string): boolean {
  const parts = sig.split(",").reduce<Record<string, string>>((acc, p) => {
    const [k, v] = p.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const timestamp = parts["t"];
  const expectedSig = parts["v1"];
  if (!timestamp || !expectedSig) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const computed = createHmac("sha256", secret).update(signedPayload).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(computed), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

function getPlanFromPrice(priceId?: string): string | null {
  if (!priceId) return null;
  const mapping: Record<string, string> = {
    "price_pro_monthly": "pro",
    "price_team_monthly": "team",
    "price_enterprise_monthly": "enterprise",
  };
  return mapping[priceId] ?? null;
}

async function syncPlanFromStripe(eventType: string, eventData: Record<string, unknown>): Promise<void> {
  const obj = eventData?.object as Record<string, unknown> | undefined;
  if (!obj) return;

  const status = obj.status as string | undefined;
  const metadata = obj.metadata as Record<string, string> | undefined;
  const userId = metadata?.user_id;
  const itemsData = (obj.items as { data?: Array<{ price?: { id: string } }> } | undefined);
  const priceId = itemsData?.data?.[0]?.price?.id;
  const plan = getPlanFromPrice(priceId);

  if (eventType === "customer.subscription.deleted" || status === "canceled" || status === "unpaid") {
    if (userId) {
      logger.info({ userId }, "Subscription ended — downgrading to free");
      await updateUserPlan(userId, "free");
    }
    return;
  }

  if (userId && plan) {
    logger.info({ userId, plan, status }, "Updating user plan from Stripe event");
    await updateUserPlan(userId, plan);
  }
}

router.post("/stripe/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string | undefined;

  if (!sig) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

  if (webhookSecret && !verifyStripeSignature(rawBody, sig, webhookSecret)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  if (!webhookSecret) {
    logger.warn("STRIPE_WEBHOOK_SECRET not configured — accepting webhook without signature verification");
  }

  try {
    const event = req.body as {
      type?: string;
      data?: { object?: Record<string, unknown> };
    };

    const eventType = event?.type ?? "unknown";
    logger.info({ eventType }, "Processing Stripe webhook");

    switch (eventType) {
      case "checkout.session.completed": {
        const session = event?.data?.object as Record<string, unknown> | undefined;
        const userId = (session?.metadata as Record<string, string> | undefined)?.user_id;
        const mode = session?.mode as string | undefined;
        if (mode === "subscription" && userId) {
          logger.info({ sessionId: session?.id, userId }, "Checkout completed for user");
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncPlanFromStripe(eventType, event?.data?.object ?? {});
        break;
      case "customer.subscription.deleted":
        await syncPlanFromStripe(eventType, event?.data?.object ?? {});
        break;
      case "invoice.paid": {
        const invoice = event?.data?.object as Record<string, unknown> | undefined;
        logger.info({ invoiceId: invoice?.id, status: invoice?.status }, "Invoice paid");
        break;
      }
      case "invoice.payment_failed": {
        const failedInvoice = event?.data?.object as Record<string, unknown> | undefined;
        logger.warn({ invoiceId: failedInvoice?.id, attempt: failedInvoice?.attempt_count }, "Invoice payment failed");
        break;
      }
      default:
        logger.debug({ eventType }, "Unhandled Stripe event");
    }

    res.json({ received: true });
  } catch (err) {
    logger.error({ err }, "Stripe webhook error");
    res.status(400).json({ error: "Webhook processing failed" });
  }
});

export default router;
