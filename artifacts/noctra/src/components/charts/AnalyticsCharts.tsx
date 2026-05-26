import { useMemo } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = {
  cyan: "#3dd8ff",
  violet: "#9575ff",
  emerald: "#34d399",
  amber: "#f59e0b",
  rose: "#f43f5e",
  magenta: "#e040fb",
};

interface ScoreTrendChartProps {
  data: Array<{ date: string; score: number; tool: string }>;
  height?: number;
}

export function ScoreTrendChart({ data, height = 300 }: ScoreTrendChartProps) {
  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>();
    for (const item of data) {
      const existing = byDate.get(item.date) ?? {};
      existing[item.tool] = item.score;
      byDate.set(item.date, { ...existing, date: item.date });
    }
    return Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [data]);

  const tools = useMemo(() => [...new Set(data.map((d) => d.tool))], [data]);
  const toolColors: Record<string, string> = {
    doctor: COLORS.rose,
    idea: COLORS.violet,
    reality: COLORS.amber,
    mvp: COLORS.cyan,
    swarm: COLORS.magenta,
    launch: COLORS.emerald,
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis dataKey="date" stroke="var(--text-quaternary)" fontSize={10} />
        <YAxis domain={[0, 100]} stroke="var(--text-quaternary)" fontSize={10} />
        <Tooltip
          contentStyle={{
            background: "var(--surface-2)",
            border: "1px solid var(--border-default)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        {tools.map((tool) => (
          <Line
            key={tool}
            type="monotone"
            dataKey={tool}
            stroke={toolColors[tool] ?? COLORS.cyan}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface TaskCompletionChartProps {
  data: Array<{ date: string; completed: number; created: number }>;
  height?: number;
}

export function TaskCompletionChart({ data, height = 300 }: TaskCompletionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis dataKey="date" stroke="var(--text-quaternary)" fontSize={10} />
        <YAxis stroke="var(--text-quaternary)" fontSize={10} />
        <Tooltip
          contentStyle={{
            background: "var(--surface-2)",
            border: "1px solid var(--border-default)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Area type="monotone" dataKey="created" stackId="1" stroke={COLORS.amber} fill={`${COLORS.amber}33`} />
        <Area type="monotone" dataKey="completed" stackId="2" stroke={COLORS.emerald} fill={`${COLORS.emerald}33`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface ToolUsageChartProps {
  data: Array<{ tool: string; count: number }>;
  height?: number;
}

export function ToolUsageChart({ data, height = 300 }: ToolUsageChartProps) {
  const toolColors: Record<string, string> = {
    doctor: COLORS.rose,
    idea: COLORS.violet,
    reality: COLORS.amber,
    mvp: COLORS.cyan,
    swarm: COLORS.magenta,
    launch: COLORS.emerald,
    twin: COLORS.magenta,
    proof: COLORS.emerald,
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis dataKey="tool" stroke="var(--text-quaternary)" fontSize={10} />
        <YAxis stroke="var(--text-quaternary)" fontSize={10} />
        <Tooltip
          contentStyle={{
            background: "var(--surface-2)",
            border: "1px solid var(--border-default)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={toolColors[entry.tool] ?? COLORS.cyan} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PriorityDistributionChartProps {
  data: Array<{ priority: string; count: number }>;
  height?: number;
}

export function PriorityDistributionChart({ data, height = 200 }: PriorityDistributionChartProps) {
  const priorityColors: Record<string, string> = {
    critical: COLORS.rose,
    high: COLORS.amber,
    medium: COLORS.cyan,
    low: COLORS.emerald,
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={4}
          dataKey="count"
          nameKey="priority"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={priorityColors[entry.priority] ?? COLORS.cyan} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--surface-2)",
            border: "1px solid var(--border-default)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "11px" }}
          formatter={(value: string) => <span style={{ color: "var(--text-secondary)" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
