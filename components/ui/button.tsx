"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "link";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "text-white font-medium",
    "border border-[rgba(16,185,129,0.4)]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
    "active:translate-y-px",
  ].join(" "),
  secondary: [
    "bg-transparent border border-[var(--border-default)] text-[var(--text-primary)]",
    "hover:bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]",
    "active:bg-[var(--bg-inset)]",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    "transition-colors duration-150",
  ].join(" "),
  ghost: [
    "bg-transparent border border-transparent text-[var(--text-secondary)]",
    "hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
    "active:bg-[var(--bg-inset)]",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    "transition-colors duration-150",
  ].join(" "),
  destructive: [
    "text-white font-medium",
    "border border-[rgba(239,68,68,0.4)]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
    "active:translate-y-px",
  ].join(" "),
  link: [
    "bg-transparent border-0 text-[var(--brand-400)] underline-offset-4",
    "hover:underline hover:text-[var(--brand-300)]",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    "p-0 h-auto",
    "transition-colors duration-150",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "h-6 px-2 text-xs rounded gap-1",
  sm: "h-8 px-3 text-sm rounded gap-1.5",
  md: "h-9 px-4 text-sm rounded gap-2",
  lg: "h-11 px-5 text-base rounded-md gap-2",
};

const spinnerSizeStyles: Record<ButtonSize, string> = {
  xs: "w-3 h-3",
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

function ButtonSpinner({ size }: { size: ButtonSize }) {
  return (
    <svg
      className={cn("animate-spin", spinnerSizeStyles[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const primaryStyle: React.CSSProperties =
      variant === "primary"
        ? {
            background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 1px rgba(16,185,129,0.4), 0 8px 24px -8px rgba(16,185,129,0.45)",
          }
        : {};

    const destructiveStyle: React.CSSProperties =
      variant === "destructive"
        ? {
            background: "linear-gradient(180deg, #EF4444 0%, #DC2626 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(239,68,68,0.4), 0 8px 24px -8px rgba(239,68,68,0.45)",
          }
        : {};

    const combinedStyle: React.CSSProperties = {
      ...primaryStyle,
      ...destructiveStyle,
      ...style,
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          "inline-flex items-center justify-center font-medium select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]",
          variant !== "link" && sizeStyles[size],
          variantStyles[variant],
          className
        )}
        style={combinedStyle}
        {...props}
      >
        {loading ? (
          <ButtonSpinner size={size} />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children && <span>{children}</span>}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
