import { MarkdownView, Badge, Panel } from "@/components/Primitives";

type Props = {
  report: {
    tool: string;
    title: string;
    score?: number | null;
    summary?: string | null;
    payload: unknown;
    created_at: string;
  };
};

export function GenericReportView({ report }: Props) {
  const p = report.payload as Record<string, unknown> | null;
  const data = (p?.data ?? p) as Record<string, unknown> | null;
  const output = p?.output as string | null;
  const markdown = p?.markdown as string | null;

  return (
    <div className="space-y-4">
      {report.summary && (
        <Panel>
          <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{report.summary}</p>
        </Panel>
      )}

      {(markdown ?? output) && (
        <Panel>
          <MarkdownView content={(markdown ?? output)!} />
        </Panel>
      )}

      {data && !markdown && !output && (
        <Panel>
          <div className="space-y-3">
            {Object.entries(data).map(([key, value]) => {
              const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
              if (Array.isArray(value)) {
                return (
                  <div key={key}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>{label}</p>
                    <div className="space-y-1">
                      {value.map((item, i) => {
                        if (typeof item === "string") {
                          return <p key={i} className="text-xs flex gap-2" style={{ color: "var(--noctra-text-soft)" }}><span className="text-xs font-mono shrink-0" style={{ color: "var(--noctra-text-muted)" }}>•</span>{item}</p>;
                        }
                        if (typeof item === "object" && item !== null) {
                          const obj = item as Record<string, unknown>;
                          const head = String(obj.title ?? obj.name ?? obj.issue ?? obj.feature ?? obj.assumption ?? obj.label ?? "");
                          return (
                            <div key={i} className="rounded-lg p-2" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                              {head && <p className="text-xs font-medium mb-1" style={{ color: "var(--noctra-text)" }}>{head}</p>}
                              {Object.entries(obj).map(([k, v]) => {
                                if (k === "title" || k === "name" || k === "issue" || k === "feature" || k === "assumption" || k === "label") return null;
                                if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
                                  return <p key={k} className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}><span className="font-medium capitalize">{k.replace(/_/g, " ")}:</span> {String(v)}</p>;
                                }
                                return null;
                              })}
                            </div>
                          );
                        }
                        return <p key={i} className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{String(item)}</p>;
                      })}
                    </div>
                  </div>
                );
              }
              if (typeof value === "object" && value !== null) {
                const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v != null);
                if (entries.length === 0) return null;
                return (
                  <div key={key}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--noctra-text-muted)" }}>{label}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {entries.map(([k, v]) => (
                        <span key={k} className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>
                          <span className="font-medium capitalize" style={{ color: "var(--noctra-text-muted)" }}>{k.replace(/_/g, " ")}:</span> {typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? String(v) : typeof v === "object" ? "[Structured]" : String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div key={key} className="flex gap-2">
                  <span className="text-xs font-medium w-32 shrink-0" style={{ color: "var(--noctra-text-muted)" }}>{label}</span>
                  <span className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{String(value)}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {!data && !markdown && !output && (
        <Panel>
          <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
            Some structured fields were missing, so this report is shown in summary mode.
          </p>
          {report.summary && (
            <p className="text-sm mt-2" style={{ color: "var(--noctra-text-soft)" }}>{report.summary}</p>
          )}
        </Panel>
      )}
    </div>
  );
}
