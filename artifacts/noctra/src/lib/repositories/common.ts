import { supabase as _supabase, isSupabaseConfigured, supabaseConfigError } from "@/integrations/supabase/client";
import { isDemoMode, getDemoUser, DEMO_USER_FALLBACK_ID } from "@/lib/demo-mode";

const supabase: any = _supabase;

export class RepositoryError extends Error {
  constructor(
    message: string,
    public code?: string,
    public operation?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export async function requireUserId(): Promise<string> {
  if (isDemoMode()) {
    return getDemoUser()?.id ?? DEMO_USER_FALLBACK_ID;
  }
  if (!isSupabaseConfigured()) {
    throw new RepositoryError(
      supabaseConfigError ?? "Supabase is not configured.",
      "SUPABASE_NOT_CONFIGURED",
      "getUser",
    );
  }
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      throw new RepositoryError("Authentication failed", "AUTH_ERROR", "getUser", { originalError: error });
    }
    if (!data.user) {
      throw new RepositoryError("You must be signed in", "NOT_AUTHENTICATED", "getUser");
    }
    return data.user.id;
  } catch (error) {
    if (error instanceof RepositoryError) throw error;
    throw new RepositoryError("Unexpected authentication error", "UNKNOWN_AUTH_ERROR", "getUser", { originalError: error });
  }
}

export function handleSupabaseError(error: any, operation: string, context?: any): never {
  switch (error?.code) {
    case 'PGRST116':
      throw new RepositoryError("Resource not found", "NOT_FOUND", operation, { ...context, originalError: error });
    case 'PGRST301':
      throw new RepositoryError("Permission denied", "PERMISSION_DENIED", operation, { ...context, originalError: error });
    case '23505':
      throw new RepositoryError("Resource already exists", "DUPLICATE", operation, { ...context, originalError: error });
    default:
      throw new RepositoryError(error?.message || "Database operation failed", "DATABASE_ERROR", operation, { ...context, originalError: error });
  }
}

export async function withErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: any
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof RepositoryError) throw error;
    handleSupabaseError(error, operation, context);
  }
}
