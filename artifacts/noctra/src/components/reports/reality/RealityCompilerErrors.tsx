import { XCircle, AlertCircle, Wrench } from "lucide-react";
import { Badge } from "@/components/Primitives";
import { SEV_COLOR } from "./reality-constants";
import type { CompilerError } from "./reality-types";

export function RealityCompilerErrors({ blockingErrors, nonBlockingErrors }: { blockingErrors: CompilerError[]; nonBlockingErrors: CompilerError[] }) {
  return (
    <>
      {blockingErrors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--noctra-rose)" }}>
            <XCircle size={11} />
            {blockingErrors.length} Blocking Error{blockingErrors.length !== 1 ? "s" : ""}
          </p>
          {blockingErrors.map((err, i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(244,63,94,0.3)" }}>
              <div className="px-3 py-2 flex items-center gap-2" style={{ background: "rgba(244,63,94,0.1)" }}>
                <span className="text-xs font-mono font-bold" style={{ color: "var(--noctra-rose)" }}>error</span>
                <span className="text-xs font-mono font-semibold" style={{ color: "var(--noctra-text)" }}>{err.code}</span>
                <Badge style={{ marginLeft: "auto", fontSize: "10px", background: "rgba(244,63,94,0.15)", color: "var(--noctra-rose)" }}>blocks build</Badge>
              </div>
              <div className="px-3 py-2.5 space-y-1.5" style={{ background: "var(--noctra-surface2)" }}>
                <p className="text-xs font-mono" style={{ color: "var(--noctra-text)" }}>{err.message}</p>
                {err.why_it_matters && (
                  <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
                    <span className="font-semibold" style={{ color: "var(--noctra-rose)" }}>Why: </span>
                    {err.why_it_matters}
                  </p>
                )}
                {err.fix && (
                  <div className="flex items-start gap-1.5">
                    <Wrench size={11} style={{ color: "var(--noctra-emerald)", flexShrink: 0, marginTop: 1 }} />
                    <p className="text-xs" style={{ color: "var(--noctra-emerald)" }}>{err.fix}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {nonBlockingErrors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--noctra-amber)" }}>
            <AlertCircle size={11} />
            {nonBlockingErrors.length} Error{nonBlockingErrors.length !== 1 ? "s" : ""}
          </p>
          {nonBlockingErrors.map((err, i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(245,158,11,0.25)" }}>
              <div className="px-3 py-2 flex items-center gap-2" style={{ background: "rgba(245,158,11,0.08)" }}>
                <span className="text-xs font-mono font-bold" style={{ color: "var(--noctra-amber)" }}>error</span>
                <span className="text-xs font-mono font-semibold" style={{ color: "var(--noctra-text)" }}>{err.code}</span>
                <span className="ml-auto text-[10px] uppercase font-medium" style={{ color: SEV_COLOR[err.severity] ?? "var(--noctra-amber)" }}>
                  {err.severity}
                </span>
              </div>
              <div className="px-3 py-2.5 space-y-1.5" style={{ background: "var(--noctra-surface2)" }}>
                <p className="text-xs font-mono" style={{ color: "var(--noctra-text)" }}>{err.message}</p>
                {err.why_it_matters && (
                  <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{err.why_it_matters}</p>
                )}
                {err.fix && (
                  <div className="flex items-start gap-1.5">
                    <Wrench size={11} style={{ color: "var(--noctra-emerald)", flexShrink: 0, marginTop: 1 }} />
                    <p className="text-xs" style={{ color: "var(--noctra-emerald)" }}>{err.fix}</p>
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
