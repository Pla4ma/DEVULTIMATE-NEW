import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import type { Request } from "express";

function userOrIpKey(req: Request): string {
  if (req.user?.id) return `user:${req.user.id}`;
  const fwd = req.headers["x-forwarded-for"];
  const ip = typeof fwd === "string" ? fwd.split(",")[0]?.trim() : req.socket?.remoteAddress;
  return `ip:${ip ?? "unknown"}`;
}

function tooMany(message: string) {
  return { error: "RATE_LIMITED", message };
}

export const globalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany("Too many requests, please try again later"),
});

export const aiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  message: tooMany("AI request rate limit reached — slow down and try again shortly"),
});

export const scanLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  message: tooMany("Scan rate limit reached — large scans are compute-intensive, please pace requests"),
});
