"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
  height?: number;
}

function CustomTooltip({
  active,
  payload,
}: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
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
        {entry.name}
      </p>
      <p
        className="font-mono font-semibold text-sm"
        style={{ color: entry.payload?.color ?? "var(--brand-400)" }}
      >
        {entry.value?.toLocaleString()} assets
      </p>
    </div>
  );
}

export default function DonutChart({ data, height = 280 }: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      <div style={{ height, position: "relative" }}>
        {/* Center label */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <p
            className="font-mono font-bold"
            style={{ fontSize: 28, color: "var(--text-primary)", lineHeight: 1 }}
          >
            {total}
          </p>
          <p
            className="text-[11px] uppercase tracking-wider mt-1"
            style={{ color: "var(--text-tertiary)" }}
          >
            Total
          </p>
        </div>

        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <defs>
              {data.map((entry, idx) => (
                <filter key={`glow-${idx}`} id={`glow-${idx}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>

            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={700}
              animationEasing="ease-out"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, index) => {
                const isActive = activeIndex === index;
                const isDimmed = activeIndex !== null && !isActive;

                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    fillOpacity={isDimmed ? 0.3 : 0.85}
                    stroke={isActive ? entry.color : "transparent"}
                    strokeWidth={isActive ? 2 : 0}
                    style={{
                      transform: isActive ? "scale(1.04)" : "scale(1)",
                      transformOrigin: "center",
                      transformBox: "fill-box",
                      transition: "transform 0.15s ease, fill-opacity 0.15s ease",
                      filter: isActive ? `url(#glow-${index})` : "none",
                    }}
                  />
                );
              })}
            </Pie>

            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 justify-center">
        {data.map((entry, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1.5 text-xs cursor-default"
            onMouseEnter={() => setActiveIndex(idx)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: entry.color }}
              aria-hidden="true"
            />
            <span style={{ color: "var(--text-secondary)" }}>{entry.name}</span>
            <span
              className="font-mono font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
