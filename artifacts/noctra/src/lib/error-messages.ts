export type ErrorContext = {
  status: number;
  error?: string;
  message?: string;
};

export type UserFriendlyError = {
  title: string;
  description: string;
  action?: string;
  retryable: boolean;
};

export function getUserFriendlyError(ctx: ErrorContext): UserFriendlyError {
  switch (ctx.status) {
    case 401:
      return {
        title: "Session expired",
        description: "Your session has expired. Please sign in again.",
        action: "Sign in",
        retryable: false,
      };

    case 413:
      return {
        title: "File too large",
        description: "Your ZIP file exceeds the 50MB limit. Try removing node_modules, dist, or other unnecessary files.",
        retryable: false,
      };

    case 400:
      if (ctx.error === "ZIP invalid") {
        return {
          title: "Invalid ZIP",
          description: "The file could not be read as a ZIP archive. Please upload a valid .zip file.",
          retryable: false,
        };
      }
      return {
        title: "Invalid request",
        description: ctx.message || "Please check your input and try again.",
        retryable: false,
      };

    case 429:
      return {
        title: "Scan limit reached",
        description: "You've reached your daily scan limit. Try tomorrow or upgrade your plan.",
        action: "View plans",
        retryable: false,
      };

    case 503:
      if (ctx.error === "AI_NOT_CONFIGURED") {
        return {
          title: "AI not configured",
          description: "The AI provider is not configured. Please contact support.",
          retryable: false,
        };
      }
      return {
        title: "Service unavailable",
        description: "The service is temporarily unavailable. Please try again in a few minutes.",
        retryable: true,
      };

    case 500:
      return {
        title: "Server error",
        description: "Something went wrong on our end. Please try again or contact support.",
        retryable: true,
      };

    default:
      return {
        title: "Unexpected error",
        description: ctx.message || "An unexpected error occurred.",
        retryable: true,
      };
  }
}
