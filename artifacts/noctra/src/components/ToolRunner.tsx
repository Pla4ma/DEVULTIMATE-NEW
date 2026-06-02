import { type ReactNode, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, RotateCcw, Save, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { saveReport, createTask } from "@/lib/repository";

type ToolRunnerProps = {
  tool: string;
  runLabel?: string;
  rerunLabel?: string;
  onRun: () => Promise<{ id: string } | null>;
  hasRun: boolean;
  children: ReactNode;
  result?: ReactNode;
  inputArea?: ReactNode;
  accent?: string;
};

export function ToolRunner({
  tool, runLabel = "Run Analysis", rerunLabel = "Re-run Analysis",
  onRun, hasRun, children, result, inputArea,
  accent = "var(--signal)",
}: ToolRunnerProps) {
  const [running, setRunning] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleRun = useCallback(async () => {
    setRunning(true);
    try {
      const res = await onRun();
      if (res?.id) {
        setResultId(res.id);
        toast({ title: `${tool} analysis complete`, variant: "default" });
      }
    } catch (err) {
      toast({ title: `${tool} analysis failed`, description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  }, [onRun, tool, toast]);

  return (
    <div className="space-y-6">
      {inputArea}

      <div className="flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={running}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: accent, color: "var(--surface-0)" }}
        >
          {running ? (
            <><Loader2 size={14} className="animate-spin" /> Analyzing...</>
          ) : (
            <><Play size={14} /> {hasRun ? rerunLabel : runLabel}</>
          )}
        </button>
        {resultId && (
          <button onClick={() => navigate(`/app/reports/${resultId}`)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
            <ExternalLink size={12} /> View Report
          </button>
        )}
      </div>

      {result}
    </div>
  );
}
