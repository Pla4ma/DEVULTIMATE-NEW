const REQUIRED_ENV_VARS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
] as const;

export function validateConfig(): void {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export function getConfigStatus(): Record<string, boolean> {
  return {
    supabaseConfigured: !!process.env.SUPABASE_URL,
    databaseConfigured: !!process.env.DATABASE_URL,
    aiConfigured: !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY,
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
  };
}
