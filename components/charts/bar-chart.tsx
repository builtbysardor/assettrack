"use client";

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

interface BarChartProps {
  data: { name: string; value: number; color: string }[];
  height?: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="rounded-md border px-3 py-2 text-xs"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border-default)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      <p
        className="font-medium mb-1"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </p>
      <p
        className="font-mono font-semibold text-sm"
        style={{ color: payload[0]?.payload?.color ?? "var(--brand-400)" }}
      >
        {payload[0]?.value?.toLocaleString()} assets
      </p>
    </div>
  );
}

export default function BarChart({ data, height = 240 }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart
        data={data}
        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        barCategoryGap="36%"
      >
        <defs>
          {data.map((entry) => (
            <linearGradient
              key={`grad-${entry.name}`}
              id={`grad-${entry.name}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
              <stop offset="100%" stopColor={entry.color} stopOpacity={0.5} />
            </linearGradient>
          ))}
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border-subtle)"
          vertical={false}
        />

        <XAxis
          dataKey="name"
          tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{
            fill: "rgba(255,255,255,0.03)",
            radius: 4,
          }}
        />

        <Bar
          dataKey="value"
          radius={[4, 4, 0, 0]}
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {data.map((entry) => (
            <Cell
              key={`cell-${entry.name}`}
              fill={`url(#grad-${entry.name})`}
              stroke={entry.color}
              strokeOpacity={0.3}
              strokeWidth={1}
            />
          ))}
        </Bar>
      </ReBarChart>
    </ResponsiveContainer>
  );
}
