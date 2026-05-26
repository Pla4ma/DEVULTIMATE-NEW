import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export function useUndo() {
  const { toast } = useToast();

  const executeWithUndo = useCallback(
    async <T>(
      action: () => Promise<T>,
      _undo: () => Promise<void>,
      {
        successMessage = "Done",
        errorMessage = "Operation failed",
        undoLabel = "Undo",
      }: {
        successMessage?: string;
        errorMessage?: string;
        undoLabel?: string;
        id?: string;
      } = {}
    ): Promise<T | null> => {
      try {
        const result = await action();

        toast({
          title: successMessage,
          description: undoLabel,
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
