import { useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Undo2 } from "lucide-react";

export function useUndo() {
  const { toast } = useToast();
  const undoActions = useRef<Map<string, () => Promise<void>>>(new Map());

  const executeWithUndo = useCallback(
    async <T>(
      action: () => Promise<T>,
      undo: () => Promise<void>,
      {
        successMessage = "Done",
        errorMessage = "Operation failed",
        undoLabel = "Undo",
        id = crypto.randomUUID(),
      }: {
        successMessage?: string;
        errorMessage?: string;
        undoLabel?: string;
        id?: string;
      } = {}
    ): Promise<T | null> => {
      try {
        const result = await action();
        undoActions.current.set(id, undo);

        toast({
          title: successMessage,
          action: {
            label: undoLabel,
            onClick: async () => {
              const fn = undoActions.current.get(id);
              if (fn) {
                try {
                  await fn();
                  undoActions.current.delete(id);
                  toast({ title: "Undone successfully" });
                } catch {
                  toast({ title: "Undo failed", variant: "destructive" });
                }
              }
            },
          },
        });

        return result;
      } catch (err) {
        toast({ title: errorMessage, description: err instanceof Error ? err.message : undefined, variant: "destructive" });
        return null;
      }
    },
    [toast]
  );

  return { executeWithUndo };
}
