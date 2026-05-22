import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";
export type BadgeSize = "sm" | "md";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-[rgba(107,123,118,0.12)] border-[rgba(107,123,118,0.25)] text-[var(--text-secondary)]",
  success:
    "bg-[rgba(16,185,129,0.10)] border-[rgba(16,185,129,0.25)] text-[var(--success)]",
  warning:
    "bg-[rgba(245,158,11,0.10)] border-[rgba(245,158,11,0.25)] text-[var(--warning)]",
  danger:
    "bg-[rgba(239,68,68,0.10)] border-[rgba(239,68,68,0.25)] text-[var(--danger)]",
  info:
    "bg-[rgba(56,189,248,0.10)] border-[rgba(56,189,248,0.25)] text-[var(--info)]",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-[10px] leading-none",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-full border",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
