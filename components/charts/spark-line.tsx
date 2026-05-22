"use client";

interface SparkLineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

export function SparkLine({ data, color, width = 56, height = 22 }: SparkLineProps) {
  if (!data || data.length < 2) return null;
  const mx = Math.max(...data);
  const mn = Math.min(...data);
  const r = mx - mn || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - mn) / r) * (height - 2) - 1}`)
    .join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
