import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { isDemoMode, getDemoUser } from "@/lib/demo-mode";

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getAuthToken(): Promise<string | null> {
  if (isDemoMode()) {
    const demoUser = getDemoUser();
    if (!demoUser) return null;
    const demoPayload = {
      sub: demoUser.id,
      email: demoUser.email,
      aud: "authenticated",
      role: "authenticated",
      app_metadata: { provider: "demo", plan: "demo" },
      is_demo: true,
      exp: Math.floor(Date.now() / 1000) + 86400,
    };
    const encoded = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })) + "." +
      btoa(JSON.stringify(demoPayload)) + ".demo-sig";
    return encoded;
  }

  if (!isSupabaseConfigured()) return null;

  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const { data } = await supabase!.auth.getSession();
    const token = data.session?.access_token ?? null;
    if (token) {
      cachedToken = token;
      tokenExpiry = Date.now() + 55 * 60 * 1000;
    }
    return token;
  } catch {
    return null;
  }
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] ??= "application/json";
  }

  return fetch(url, { ...options, headers });
}
