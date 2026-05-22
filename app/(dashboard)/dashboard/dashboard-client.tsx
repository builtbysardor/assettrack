"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { animate, useMotionValue } from "framer-motion";
import { SparkLine } from "@/components/charts/spark-line";
import { StatusPill } from "@/components/ui/status-pill";
import type { AssetStatus } from "@/components/ui/status-pill";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CategoryData {
  name: string;
  color: string;
  count: number;
  delta: number;
  spark: number[];
}

interface RecentAsset {
  id: string;
  tag: string;
  name: string;
  status: string;
  assignedTo: string | null;
  warrantyExpiry: string | null;
  category: { name: string; color: string } | null;
  location: { building: string; room: string } | null;
}

interface WarrantyItem {
  id: string;
  tag: string;
  name: string;
  daysLeft: number;
}

interface DashboardClientProps {
  total: number;
  statusCounts: Record<string, number>;
  warrantyCount: number;
  warrantyItems: WarrantyItem[];
  categoryData: CategoryData[];
  recentAssets: RecentAsset[];
}

// ── Animated number (count-up) ────────────────────────────────────────────────

function AnimatedNumber({ value, style }: { value: number; style?: React.CSSProperties }) {
  const motionVal = useMotionValue(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        if (ref.current) ref.current.textContent = Math.round(latest).toLocaleString();
      },
    });
    return controls.stop;
  }, [motionVal, value]);

  return <span ref={ref} style={style}>0</span>;
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 8,
      boxShadow: "var(--shadow)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardSection({ title }: { title: string }) {
  return (
    <div style={{
      padding: "8px 14px",
      borderBottom: "1px solid var(--border-subtle)",
      fontSize: 10, color: "var(--text-tertiary)",
      textTransform: "uppercase", letterSpacing: "0.09em",
    }}>
      {title}
    </div>
  );
}

// ── Category card with sparkline ──────────────────────────────────────────────

function CatCard({ cat }: { cat: CategoryData }) {
  return (
    <Link href="/assets" style={{ textDecoration: "none" }}>
      <div
        className="card-hover"
        style={{
          padding: "14px 16px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderTop: `3px solid ${cat.color}`,
          borderRadius: 8,
          cursor: "pointer",
          boxShadow: "var(--shadow)",
        }}
      >
        <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>{cat.name}</div>
        <AnimatedNumber
          value={cat.count}
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, color: "var(--text-primary)", fontWeight: 700, lineHeight: 1, display: "block", marginBottom: 10 }}
        />
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <SparkLine data={cat.spark} color={cat.color} />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: cat.delta > 0 ? "var(--success)" : cat.delta < 0 ? "var(--danger)" : "var(--text-tertiary)",
          }}>
            {cat.delta > 0 ? "+" : ""}{cat.delta}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DashboardClient({
  total,
  statusCounts,
  warrantyCount,
  warrantyItems,
  categoryData,
  recentAssets,
}: DashboardClientProps) {
  const subStats = [
    { v: statusCounts.ACTIVE ?? 0, l: "Active", c: "var(--success)" },
    { v: statusCounts.MAINTENANCE ?? 0, l: "Maintenance", c: "var(--warning)" },
    { v: statusCounts.INACTIVE ?? 0, l: "Inactive", c: "var(--text-tertiary)" },
    { v: warrantyCount, l: "Warranty ⚠", c: "var(--danger)" },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--bg-base)" }}>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Hero card ─────────────────────────────────────────── */}
        <Card style={{ padding: "20px 24px", position: "relative", overflow: "hidden" }}>
          {/* Top accent bar */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "var(--accent)", borderRadius: "8px 8px 0 0" }} />
          {/* Watermark */}
          <div style={{
            position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 110,
            color: "var(--border-subtle)", fontWeight: 700,
            userSelect: "none", lineHeight: 1, pointerEvents: "none",
          }}>
            {total}
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 6 }}>
              Total assets
            </div>
            <AnimatedNumber
              value={total}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 52, color: "var(--text-primary)", fontWeight: 700, lineHeight: 1, display: "block", marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {subStats.map(({ v, l, c }) => (
                <div key={l}>
                  <AnimatedNumber
                    value={v}
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: c, fontWeight: 700, display: "block" }}
                  />
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ── Warranty alert strip ──────────────────────────────── */}
        {warrantyCount > 0 && (
          <div style={{
            background: "rgba(220,38,38,0.05)",
            border: "1px solid rgba(220,38,38,0.18)",
            borderLeft: "3px solid var(--danger)",
            borderRadius: "0 7px 7px 0",
            padding: "10px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                <strong style={{ color: "var(--danger)" }}>{warrantyCount} assets</strong> warranty expires within 30 days
              </span>
            </div>
            <Link href="/assets" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              height: 28, padding: "0 12px", borderRadius: 5,
              background: "var(--danger)", color: "white",
              fontSize: 12, fontWeight: 500, textDecoration: "none",
              border: "none",
            }}>
              View
            </Link>
          </div>
        )}

        {/* ── Category sparklines ───────────────────────────────── */}
        {categoryData.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>
              By category
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(categoryData.length, 4)}, 1fr)`, gap: 10 }}>
              {categoryData.map((cat) => <CatCard key={cat.name} cat={cat} />)}
            </div>
          </div>
        )}

        {/* ── Bottom row: recent + expiring ─────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

          {/* Recent assets */}
          <Card style={{ overflow: "hidden" }}>
            <div style={{
              padding: "11px 16px", borderBottom: "1px solid var(--border-subtle)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>Recent assets</span>
              <Link href="/assets" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
                All →
              </Link>
            </div>
            {recentAssets.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "var(--text-tertiary)" }}>No assets yet</div>
            ) : recentAssets.map((a, i) => (
              <Link key={a.id} href={`/assets`} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 16px",
                  borderBottom: i < recentAssets.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  transition: "background 0.12s",
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-elevated)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = ""}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500, marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.name}
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.04em" }}>
                      {a.tag}
                    </span>
                  </div>
                  <StatusPill status={a.status as AssetStatus} />
                </div>
              </Link>
            ))}
          </Card>

          {/* Warranty expiring */}
          <Card style={{ overflow: "hidden" }}>
            <div style={{ padding: "11px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>⚠️ Warranty expiring</span>
            </div>
            {warrantyItems.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "var(--text-tertiary)" }}>
                No warranties expiring soon
              </div>
            ) : warrantyItems.map((w) => (
              <div key={w.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 16px", borderBottom: "1px solid var(--border-subtle)",
              }}>
                <div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-secondary)", letterSpacing: "0.04em" }}>
                    {w.tag}
                  </span>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{w.name}</div>
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                  color: w.daysLeft <= 7 ? "var(--danger)" : w.daysLeft <= 14 ? "var(--warning)" : "var(--text-tertiary)",
                  background: w.daysLeft <= 7 ? "rgba(220,38,38,0.07)" : w.daysLeft <= 14 ? "rgba(217,119,6,0.07)" : "var(--bg-inset)",
                  border: `1px solid ${w.daysLeft <= 7 ? "rgba(220,38,38,0.22)" : w.daysLeft <= 14 ? "rgba(217,119,6,0.22)" : "var(--border-subtle)"}`,
                  borderRadius: 3, padding: "2px 8px",
                }}>
                  {w.daysLeft}d
                </div>
              </div>
            ))}
            <div style={{ padding: "10px 16px", textAlign: "center" }}>
              <Link href="/assets" style={{
                fontSize: 12, color: "var(--text-tertiary)",
                border: "1px solid var(--border-default)",
                borderRadius: 5, padding: "5px 14px",
                textDecoration: "none", display: "inline-block",
              }}>
                All assets →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
