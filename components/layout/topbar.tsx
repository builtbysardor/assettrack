"use client";

import type { ReactNode } from "react";

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <div style={{
      height: 56, padding: "0 24px", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: "1px solid var(--border-subtle)",
      background: "var(--bg-surface)",
    }}>
      <div>
        <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0, marginTop: 1 }}>{subtitle}</p>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {actions}
        </div>
      )}
    </div>
  );
}
