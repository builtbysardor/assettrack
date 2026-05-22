"use client";

import { useState } from "react";
import { StatusPill } from "@/components/ui/status-pill";
import type { AssetStatus } from "@/components/ui/status-pill";
import type { AssetWithRelations } from "./asset-table";

interface AssetCardProps {
  asset: AssetWithRelations;
  onClick: () => void;
}

function isWarrantyExpired(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

export function AssetCard({ asset: a, onClick }: AssetCardProps) {
  const [hov, setHov] = useState(false);
  const expired = isWarrantyExpired(a.warrantyExpiry);

  const warrantyLabel = expired
    ? "⚠ Expired"
    : a.warrantyExpiry
    ? new Date(a.warrantyExpiry).toISOString().slice(0, 7)
    : "—";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: 14,
        cursor: "pointer",
        background: "var(--bg-surface)",
        border: `1px solid ${hov ? "var(--border-default)" : "var(--border-subtle)"}`,
        borderTop: `3px solid ${a.category.color}`,
        borderRadius: 8,
        boxShadow: hov ? "var(--shadow-h)" : "var(--shadow)",
        transition: "all 0.14s",
        transform: hov ? "translateY(-1px)" : "none",
      }}
    >
      {/* Tag + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.04em" }}>
          {a.tag}
        </span>
        <StatusPill status={a.status as AssetStatus} />
      </div>

      {/* Name */}
      <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600, marginBottom: 7, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
        {a.name}
      </div>

      {/* Category + assignedTo */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 10, color: a.category.color,
          background: `${a.category.color}18`,
          border: `1px solid ${a.category.color}30`,
          borderRadius: 2, padding: "1px 5px", flexShrink: 0,
        }}>
          {a.category.name}
        </span>
        {a.assignedTo && (
          <span style={{ fontSize: 11, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>
            {a.assignedTo}
          </span>
        )}
      </div>

      {/* Location + warranty */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        paddingTop: 8, borderTop: "1px solid var(--border-subtle)",
      }}>
        <span style={{ fontSize: 11, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {a.location.building} / {a.location.room}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          color: expired ? "var(--danger)" : "var(--text-disabled)",
          flexShrink: 0, marginLeft: 4,
        }}>
          {warrantyLabel}
        </span>
      </div>
    </div>
  );
}
