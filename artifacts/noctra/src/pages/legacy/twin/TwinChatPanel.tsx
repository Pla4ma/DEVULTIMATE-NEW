import { useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { NoctraButton } from "@/components/Primitives";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import type { Msg } from "./twin-types";

const TOOL = TOOL_BY_KEY["twin"]!;

interface TwinChatPanelProps {
  messages: Msg[];
  loading: boolean;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
}

export function TwinChatPanel({ messages, loading, input, setInput, onSend }: TwinChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  return (
    <div className="lg:col-span-2 flex flex-col gap-3">
      <div className="flex flex-col gap-3 min-h-[400px] max-h-[500px] overflow-y-auto rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border-default)" }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] px-3 py-2.5 rounded-xl text-sm whitespace-pre-wrap"
              style={{
                background: msg.role === "user" ? `${TOOL.accent}20` : "var(--surface-2)",
                border: `1px solid ${msg.role === "user" ? `${TOOL.accent}30` : "var(--border-default)"}`,
                color: "var(--text-primary)",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2.5 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
              <Loader2 size={14} className="animate-spin" style={{ color: TOOL.accent }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), void onSend())}
          placeholder="Ask about patterns, contradictions, next moves…"
          disabled={loading}
          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
        />
        <NoctraButton onClick={onSend} disabled={loading || !input.trim()}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </NoctraButton>
      </div>
    </div>
  );
}
