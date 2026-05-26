import { useState, useCallback } from "react";

interface CheckoutOptions {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = useCallback(async (options: CheckoutOptions) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: options.priceId,
          successUrl: options.successUrl ?? `${window.location.origin}/app?checkout=success`,
          cancelUrl: options.cancelUrl ?? `${window.location.origin}/pricing?checkout=cancelled`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
      return url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Checkout failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const openCustomerPortal = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to open customer portal");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
      return url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Portal access failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, createCheckoutSession, openCustomerPortal };
}
