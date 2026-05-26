import { useState, useCallback, useRef, useEffect } from "react";

export interface StreamOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

export interface StreamState {
  text: string;
  isStreaming: boolean;
  error: Error | null;
}

export function useAIStream() {
  const [state, setState] = useState<StreamState>({
    text: "",
    isStreaming: false,
    error: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const stream = useCallback(async (
    endpoint: string,
    body: Record<string, unknown>,
    options?: StreamOptions
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState({ text: "", isStreaming: true, error: null });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setState({ text: fullText, isStreaming: false, error: null });
              options?.onComplete?.(fullText);
              return fullText;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullText += parsed.content;
                setState(prev => ({ ...prev, text: fullText }));
                options?.onChunk?.(parsed.content);
              }
            } catch {
              fullText += data;
              setState(prev => ({ ...prev, text: fullText }));
              options?.onChunk?.(data);
            }
          }
        }
      }

      setState({ text: fullText, isStreaming: false, error: null });
      options?.onComplete?.(fullText);
      return fullText;
    } catch (err) {
      if (controller.signal.aborted) {
        return state.text;
      }
      const error = err instanceof Error ? err : new Error("Stream failed");
      setState(prev => ({ ...prev, isStreaming: false, error }));
      options?.onError?.(error);
      throw error;
    }
  }, [state.text]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setState(prev => ({ ...prev, isStreaming: false }));
    }
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({ text: "", isStreaming: false, error: null });
  }, [cancel]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    stream,
    cancel,
    reset,
  };
}

export function useStreamingChat() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const { text, isStreaming, error, stream, cancel, reset } = useAIStream();

  const sendMessage = useCallback(async (content: string, systemPrompt?: string) => {
    const userMsg = { role: "user" as const, content };
    setMessages(prev => [...prev, userMsg]);

    const assistantMsg = { role: "assistant" as const, content: "" };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      await stream("/api/chat", {
        messages: [...messages, userMsg],
        system: systemPrompt,
      }, {
        onChunk: (chunk) => {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
              last.content += chunk;
            }
            return updated;
          });
        },
        onComplete: (fullText) => {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
              last.content = fullText;
            }
            return updated;
          });
        },
      });
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant") {
          last.content = `Error: ${err instanceof Error ? err.message : "Stream failed"}`;
        }
        return updated;
      });
    }
  }, [messages, stream]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    reset();
  }, [reset]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    cancel,
  };
}
