import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

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

const SUPABASE_URL = process.env.SUPABASE_URL;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
if (SUPABASE_URL) {
  const url = new URL(SUPABASE_URL);
  jwks = createRemoteJWKSet(new URL(`${url.origin}/.well-known/jwks.json`));
}

async function parseJWT(token: string): Promise<AuthenticatedUser | null> {
  try {
    if (jwks) {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: `${SUPABASE_URL}/auth/v1`,
        algorithms: ["RS256"],
      });
      return mapPayload(payload);
    }
    if (JWT_SECRET) {
      const { createSecretKey } = await import("node:crypto");
      const secretKey = createSecretKey(Buffer.from(JWT_SECRET, "base64"));
      const { payload } = await jwtVerify(token, secretKey, {
        algorithms: ["HS256"],
      });
      return mapPayload(payload);
    }
    return null;
  } catch {
    return null;
  }
}

function mapPayload(payload: JWTPayload): AuthenticatedUser | null {
  const sub = payload.sub;
  if (!sub) return null;

  const appMetadata = payload.app_metadata as Record<string, unknown> | undefined;
  const isDemo = appMetadata?.provider === "demo" || (payload as Record<string, unknown>).is_demo === true;
  const plan = (appMetadata?.plan as AuthenticatedUser["plan"]) ?? (isDemo ? "demo" : "free");

  return {
    id: sub,
    email: (payload.email as string) ?? null,
    isDemo,
    plan,
  };
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

  if (!JWT_SECRET && !jwks) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Authentication is not configured" });
    return;
  }

  parseJWT(token).then((user) => {
    if (!user) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid or expired token" });
      return;
    }
    req.user = user;
    next();
  }).catch(() => {
    res.status(500).json({ error: "SERVER_ERROR", message: "Token verification failed" });
  });
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.slice(7);
  if (token && (JWT_SECRET || jwks)) {
    parseJWT(token).then((user) => {
      if (user) req.user = user;
      next();
    }).catch(() => next());
  } else {
    next();
  }
}
