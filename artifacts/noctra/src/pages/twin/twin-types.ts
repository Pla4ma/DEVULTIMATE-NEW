export type Msg = { role: "user" | "assistant"; content: string };

export type Project = { id: string; name: string; stage?: string | null };
