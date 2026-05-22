import * as React from "react";
import { cn } from "@/lib/utils";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
};

const strokeWidthMap: Record<SpinnerSize, number> = {
  sm: 2.5,
  md: 2.5,
  lg: 3,
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  const px = sizeMap[size];
  const strokeWidth = strokeWidthMap[size];
  const r = (px - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "motion-safe:animate-spin",
        "@media (prefers-reduced-motion: reduce) { animation: none !important; }",
        className
      )}
      aria-label="Loading"
      role="status"
      style={{
        animation: "spin 0.75s linear infinite",
      }}
    >
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { svg[role="status"] { animation: none !important; } }
      `}</style>
      {/* Track */}
      <circle
        cx={px / 2}
        cy={px / 2}
        r={r}
        stroke="var(--border-strong)"
        strokeWidth={strokeWidth}
      />
      {/* Arc */}
      <circle
        cx={px / 2}
        cy={px / 2}
        r={r}
        stroke="var(--brand-500)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.75}
        transform={`rotate(-90 ${px / 2} ${px / 2})`}
      />
    </svg>
  );
}
