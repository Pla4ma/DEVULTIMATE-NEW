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
                    <div className="flex flex-wrap gap-1">
                      {value.map((item, i) => (
                        <Badge key={i} variant="muted">{typeof item === "string" ? item : JSON.stringify(item)}</Badge>
                      ))}
                    </div>
                  </div>
                );
              }
              if (typeof value === "object" && value !== null) return null;
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
          <pre className="text-xs overflow-auto" style={{ color: "var(--noctra-text-soft)" }}>{JSON.stringify(report.payload, null, 2)}</pre>
        </Panel>
      )}
    </div>
  );
}
