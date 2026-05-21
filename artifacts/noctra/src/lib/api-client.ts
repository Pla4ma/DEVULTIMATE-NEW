import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { isDemoMode } from "@/lib/demo-mode";

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getAuthToken(): Promise<string | null> {
  if (isDemoMode()) {
    return null;
  }

  if (!isSupabaseConfigured()) return null;

  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const supabaseClient = supabase;
    if (!supabaseClient) return null;
    const { data } = await supabaseClient.auth.getSession();
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
