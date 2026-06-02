import { XCircle, AlertCircle, Wrench } from "lucide-react";
import { Badge } from "@/components/Primitives";
import { SEV_COLOR } from "./reality-constants";
import type { CompilerError } from "./reality-types";

export function RealityCompilerErrors({ blockingErrors, nonBlockingErrors }: { blockingErrors: CompilerError[]; nonBlockingErrors: CompilerError[] }) {
  return (
    <>
      {blockingErrors.length > 0 && (
        <div className="space-y-2">
          <p className="eyebrow flex items-center gap-1.5" style={{ color: "var(--color-danger)" }}>
            <XCircle size={11} />
            {blockingErrors.length} Blocking Error{blockingErrors.length !== 1 ? "s" : ""}
          </p>
          {blockingErrors.map((err, i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-danger-soft)" }}>
              <div className="px-3 py-2 flex items-center gap-2" style={{ background: "var(--color-danger-soft)" }}>
                <span className="text-xs font-mono font-bold" style={{ color: "var(--color-danger)" }}>error</span>
                <span className="text-xs font-mono font-semibold" style={{ color: "var(--text-primary)" }}>{err.code}</span>
                <Badge style={{ marginLeft: "auto", fontSize: "10px", background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>blocks build</Badge>
              </div>
              <div className="px-3 py-2.5 space-y-1.5" style={{ background: "var(--surface-2)" }}>
                <p className="text-xs font-mono" style={{ color: "var(--text-primary)" }}>{err.message}</p>
                {err.why_it_matters && (
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    <span className="font-semibold" style={{ color: "var(--color-danger)" }}>Why: </span>
                    {err.why_it_matters}
                  </p>
                )}
                {err.fix && (
                  <div className="flex items-start gap-1.5">
                    <Wrench size={11} style={{ color: "var(--color-success)", flexShrink: 0, marginTop: 1 }} />
                    <p className="text-xs" style={{ color: "var(--color-success)" }}>{err.fix}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {nonBlockingErrors.length > 0 && (
        <div className="space-y-2">
          <p className="eyebrow flex items-center gap-1.5" style={{ color: "var(--color-warning)" }}>
            <AlertCircle size={11} />
            {nonBlockingErrors.length} Error{nonBlockingErrors.length !== 1 ? "s" : ""}
          </p>
          {nonBlockingErrors.map((err, i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-warning-soft)" }}>
              <div className="px-3 py-2 flex items-center gap-2" style={{ background: "var(--color-warning-soft)" }}>
                <span className="text-xs font-mono font-bold" style={{ color: "var(--color-warning)" }}>error</span>
                <span className="text-xs font-mono font-semibold" style={{ color: "var(--text-primary)" }}>{err.code}</span>
                <span className="ml-auto text-[10px] uppercase font-medium" style={{ color: SEV_COLOR[err.severity] ?? "var(--color-warning)" }}>
                  {err.severity}
                </span>
              </div>
              <div className="px-3 py-2.5 space-y-1.5" style={{ background: "var(--surface-2)" }}>
                <p className="text-xs font-mono" style={{ color: "var(--text-primary)" }}>{err.message}</p>
                {err.why_it_matters && (
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{err.why_it_matters}</p>
                )}
                {err.fix && (
                  <div className="flex items-start gap-1.5">
                    <Wrench size={11} style={{ color: "var(--color-success)", flexShrink: 0, marginTop: 1 }} />
                    <p className="text-xs" style={{ color: "var(--color-success)" }}>{err.fix}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
