import * as React from "react";
import { cn } from "@/lib/utils";

export type AssetStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "RETIRED" | "MISSING";

export interface StatusColors {
  bg: string;
  border: string;
  text: string;
  label: string;
}

export const STATUS_COLORS: Record<AssetStatus, StatusColors> = {
  ACTIVE: {
    bg:     "rgba(0,0,0,0.06)",
    border: "rgba(0,0,0,0.15)",
    text:   "var(--accent)",
    label:  "Active",
  },
  INACTIVE: {
    bg:     "rgba(138,138,132,0.08)",
    border: "rgba(138,138,132,0.22)",
    text:   "var(--t3)",
    label:  "Inactive",
  },
  MAINTENANCE: {
    bg:     "rgba(217,119,6,0.08)",
    border: "rgba(217,119,6,0.22)",
    text:   "var(--warn)",
    label:  "Maintenance",
  },
  RETIRED: {
    bg:     "rgba(138,138,132,0.08)",
    border: "rgba(138,138,132,0.22)",
    text:   "var(--t3)",
    label:  "Retired",
  },
  MISSING: {
    bg:     "rgba(220,38,38,0.08)",
    border: "rgba(220,38,38,0.22)",
    text:   "var(--err)",
    label:  "Missing",
  },
};

export interface StatusPillProps {
  status: AssetStatus;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.INACTIVE;

  return (
    <span
      className={cn("inline-flex items-center whitespace-nowrap", className)}
      style={{
        padding: "2px 8px",
        borderRadius: 3,
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1.6,
      }}
    >
      {colors.label}
    </span>
  );
}
