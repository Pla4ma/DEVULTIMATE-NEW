import { IDEA_PROMPT, REALITY_PROMPT, MVP_PROMPT, PROOF_PROMPT, SWARM_PROMPT, DOCTOR_PROMPT, LAUNCH_PROMPT, TWIN_PROMPT, GENERIC_PROMPT } from "../../prompts";

export function buildSystemPrompt(tool: string): string {
  const prompts: Record<string, string> = {
    idea: IDEA_PROMPT,
    reality: REALITY_PROMPT,
    mvp: MVP_PROMPT,
    proof: PROOF_PROMPT,
    swarm: SWARM_PROMPT,
    doctor: DOCTOR_PROMPT,
    launch: LAUNCH_PROMPT,
    twin: TWIN_PROMPT,
  };
  return prompts[tool] ?? GENERIC_PROMPT;
}
