export type Phase = "idle" | "running" | "done" | "error";

export type CompileMode = "idea" | "mvp" | "retention" | "monetization" | "ai-wrapper" | "launch" | "full";

export type CompilerError = {
  code: string;
  severity: string;
  message: string;
  why_it_matters?: string;
  fix?: string;
  blocks_build?: boolean;
};
