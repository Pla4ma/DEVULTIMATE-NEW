import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyStripeSignature } from "./billing";

const SECRET = "whsec_test_secret_abc123";

function makeSig(payload: string, ts: number, secret = SECRET): string {
  const v1 = createHmac("sha256", secret).update(`${ts}.${payload}`).digest("hex");
  return `t=${ts},v1=${v1}`;
}

const now = () => Math.floor(Date.now() / 1000);

describe("verifyStripeSignature", () => {
  const payload = JSON.stringify({ type: "invoice.paid", data: { object: { id: "in_1" } } });

  it("accepts a valid, fresh signature", () => {
    expect(verifyStripeSignature(payload, makeSig(payload, now()), SECRET)).toBe(true);
  });

  it("rejects a forged v1 signature", () => {
    const sig = `t=${now()},v1=${"f".repeat(64)}`;
    expect(verifyStripeSignature(payload, sig, SECRET)).toBe(false);
  });

  it("rejects when the payload is tampered after signing", () => {
    const sig = makeSig(payload, now());
    const tampered = JSON.stringify({ type: "invoice.paid", data: { object: { id: "EVIL" } } });
    expect(verifyStripeSignature(tampered, sig, SECRET)).toBe(false);
  });

  it("rejects a signature signed with the wrong secret", () => {
    const sig = makeSig(payload, now(), "whsec_wrong_secret");
    expect(verifyStripeSignature(payload, sig, SECRET)).toBe(false);
  });

  it("rejects an expired timestamp outside the 5-minute tolerance (replay protection)", () => {
    expect(verifyStripeSignature(payload, makeSig(payload, now() - 600), SECRET)).toBe(false);
  });

  it("rejects a future timestamp outside tolerance", () => {
    expect(verifyStripeSignature(payload, makeSig(payload, now() + 600), SECRET)).toBe(false);
  });

  it("accepts a timestamp at the edge of tolerance", () => {
    expect(verifyStripeSignature(payload, makeSig(payload, now() - 290), SECRET)).toBe(true);
  });

  it("rejects a malformed signature header (missing v1)", () => {
    expect(verifyStripeSignature(payload, `t=${now()}`, SECRET)).toBe(false);
  });

  it("rejects a malformed signature header (missing t)", () => {
    const v1 = createHmac("sha256", SECRET).update(payload).digest("hex");
    expect(verifyStripeSignature(payload, `v1=${v1}`, SECRET)).toBe(false);
  });

  it("rejects an empty signature header", () => {
    expect(verifyStripeSignature(payload, "", SECRET)).toBe(false);
  });

  it("rejects a non-numeric timestamp", () => {
    const v1 = createHmac("sha256", SECRET).update(`abc.${payload}`).digest("hex");
    expect(verifyStripeSignature(payload, `t=abc,v1=${v1}`, SECRET)).toBe(false);
  });
});
