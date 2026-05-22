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
    bg: "rgba(16,185,129,0.10)",
    border: "rgba(16,185,129,0.30)",
    text: "#10B981",
    label: "Active",
  },
  INACTIVE: {
    bg: "rgba(107,123,118,0.10)",
    border: "rgba(107,123,118,0.30)",
    text: "#6B7B76",
    label: "Inactive",
  },
  MAINTENANCE: {
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.30)",
    text: "#F59E0B",
    label: "Maintenance",
  },
  RETIRED: {
    bg: "rgba(239,68,68,0.10)",
    border: "rgba(239,68,68,0.30)",
    text: "#EF4444",
    label: "Retired",
  },
  MISSING: {
    bg: "rgba(139,92,246,0.10)",
    border: "rgba(139,92,246,0.30)",
    text: "#8B5CF6",
    label: "Missing",
  },
};

export interface StatusPillProps {
  status: AssetStatus;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const colors = STATUS_COLORS[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5",
        "text-[11px] font-medium uppercase tracking-wider",
        "rounded-[6px] border",
        className
      )}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      {colors.label}
    </span>
  );
}
