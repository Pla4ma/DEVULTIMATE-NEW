import { createHmac, timingSafeEqual, createVerify } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  isDemo: boolean;
  plan: "demo" | "free" | "pro" | "team" | "enterprise" | "admin";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

function decodeBase64Url(str: string): string {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function verifySignature(payload: string, signature: string): boolean {
  if (!JWT_SECRET) return false;
  const expected = createHmac("sha256", JWT_SECRET).update(payload).digest("base64url");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function parseToken(token: string): AuthenticatedUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const header = JSON.parse(decodeBase64Url(parts[0]));
    if (!header?.alg?.startsWith("HS") && !header?.alg?.startsWith("RS")) return null;

    const payload = JSON.parse(decodeBase64Url(parts[1]));
    if (!payload?.sub && !payload?.aud) return null;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    const isDemo = payload?.app_metadata?.provider === "demo" || payload?.is_demo === true;
    const plan = (payload?.app_metadata?.plan as AuthenticatedUser["plan"]) ?? (isDemo ? "demo" : "free");

    return {
      id: payload.sub,
      email: payload.email ?? null,
      isDemo,
      plan,
    };
  } catch {
    return null;
  }
}

function verifyWithRSA(headerAlg: string, payload: string, signature: string): boolean {
  if (headerAlg === "RS256" && JWT_SECRET) {
    const key = `-----BEGIN PUBLIC KEY-----\n${JWT_SECRET}\n-----END PUBLIC KEY-----`;
    try {
      const verifier = createVerify("RSA-SHA256");
      verifier.update(payload);
      return verifier.verify(key, Buffer.from(signature, "base64url"));
    } catch {
      return false;
    }
  }
  return false;
}

function tryVerify(token: string): AuthenticatedUser | null {
  if (!JWT_SECRET) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const payloadStr = `${parts[0]}.${parts[1]}`;

  if (verifySignature(payloadStr, parts[2])) {
    return parseToken(token);
  }

  const header = JSON.parse(decodeBase64Url(parts[0]));
  if (header?.alg === "RS256" && verifyWithRSA("RS256", payloadStr, parts[2])) {
    return parseToken(token);
  }

  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  if (!token) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "No token provided" });
    return;
  }

  if (!JWT_SECRET) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Authentication is not configured" });
    return;
  }

  const user = tryVerify(token);
  if (!user) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid or expired token" });
    return;
  }

  req.user = user;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.slice(7);
  if (token && JWT_SECRET) {
    const user = tryVerify(token);
    if (user) req.user = user;
  }

  next();
}
