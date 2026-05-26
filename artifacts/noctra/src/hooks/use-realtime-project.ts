import { useEffect, useCallback, useRef, useState } from "react";

const supabase = (() => {
  try {
    const { supabase } = require("@/integrations/supabase/client");
    return supabase;
  } catch {
    return null;
  }
})();

interface PresenceState {
  userId: string;
  email: string;
  cursor?: { x: number; y: number };
  activeTool?: string;
  lastSeen: string;
}

interface RealtimeEvent {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

export function useRealtimeProject(projectId: string | null) {
  const [presence, setPresence] = useState<PresenceState[]>([]);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!projectId || !supabase) return;

    const channel = supabase.channel(`project:${projectId}`)
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: PresenceState[] = [];
        for (const key in state) {
          const presences = state[key] as any[];
          users.push(...presences);
        }
        setPresence(users);
      })
      .on("presence", { event: "join" }, ({ newPresences }: { newPresences: unknown[] }) => {
        console.log("User joined:", newPresences);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }: { leftPresences: unknown[] }) => {
        console.log("User left:", leftPresences);
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "reports",
        filter: `project_id=eq.${projectId}`,
      }, (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
        setEvents((prev) => [{
          type: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
          table: "reports",
          record: payload.new,
          old_record: payload.old,
        }, ...prev].slice(0, 50));
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "tasks",
        filter: `project_id=eq.${projectId}`,
      }, (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
        setEvents((prev) => [{
          type: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
          table: "tasks",
          record: payload.new,
          old_record: payload.old,
        }, ...prev].slice(0, 50));
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [projectId]);

  const trackPresence = useCallback(async (state: Partial<PresenceState>) => {
    if (!channelRef.current) return;
    await channelRef.current.track({
      ...state,
      lastSeen: new Date().toISOString(),
    });
  }, []);

  const updateCursor = useCallback((x: number, y: number) => {
    trackPresence({ cursor: { x, y } });
  }, [trackPresence]);

  const setActiveTool = useCallback((tool: string) => {
    trackPresence({ activeTool: tool });
  }, [trackPresence]);

  return {
    presence,
    events,
    trackPresence,
    updateCursor,
    setActiveTool,
  };
}
