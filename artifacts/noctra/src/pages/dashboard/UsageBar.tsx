import { getUsagePercent, getUsageColor } from "@/lib/usage";

type Props = {
  usage: { plan: string; scans: { used: number; limit: number | string }; reports: { used: number; limit: number | string } };
};

export function UsageBar({ usage }: Props) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-lg" style={{ background: "var(--noctra-surface)", border: "1px solid var(--noctra-border)" }}>
      <span className="text-xs font-medium" style={{ color: "var(--noctra-text-muted)" }}>
        Plan: <span className="font-semibold uppercase" style={{ color: "var(--noctra-cyan)" }}>{usage.plan}</span>
      </span>
      <div className="flex items-center gap-2">
        <span className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>Scans</span>
        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--noctra-surface2)" }}>
          <div className="h-full rounded-full" style={{ width: `${getUsagePercent(usage.scans)}%`, background: getUsageColor(getUsagePercent(usage.scans)) }} />
        </div>
        <span className="text-[10px] font-mono" style={{ color: "var(--noctra-text-muted)" }}>{usage.scans.used}/{usage.scans.limit}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>Reports</span>
        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--noctra-surface2)" }}>
          <div className="h-full rounded-full" style={{ width: `${getUsagePercent(usage.reports)}%`, background: getUsageColor(getUsagePercent(usage.reports)) }} />
        </div>
        <span className="text-[10px] font-mono" style={{ color: "var(--noctra-text-muted)" }}>{usage.reports.used}/{usage.reports.limit}</span>
      </div>
    </div>
  );
}
