import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export let supabaseConfigError: string | null = null;

function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    supabaseConfigError =
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Replit Secrets.";
    return null;
  }

  supabaseConfigError = null;
  return { url, anonKey };
}

const config = getSupabaseConfig();

export const supabase: SupabaseClient | null = config
  ? createClient(config.url, config.anonKey)
  : null;

export function isSupabaseConfigured(): boolean {
  return supabaseConfigError === null && config !== null;
}
