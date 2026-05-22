"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { StatusPill } from "@/components/ui/status-pill";
import type { AssetStatus } from "@/components/ui/status-pill";
import { AssetForm } from "@/components/assets/asset-form";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import type { AssetWithRelations } from "@/components/assets/asset-table";

type AuditAction = "CREATE" | "UPDATE" | "DELETE";

interface AuditLogEntry {
  id: string;
  action: AuditAction;
  changes: Record<string, unknown>;
  createdAt: string;
  user: { name: string; email: string };
}

interface AssetDetailResponse {
  ok: boolean;
  item: AssetWithRelations;
  auditLogs: AuditLogEntry[];
}

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

function fmtCurrency(v: string | number | null | undefined): string {
  if (v == null) return "—";
  return "$" + Number(v).toLocaleString();
}

function isExpired(d: string | Date | null | undefined): boolean {
  if (!d) return false;
  return new Date(d) < new Date();
}

function auditLabel(action: AuditAction): string {
  if (action === "CREATE") return "Created";
  if (action === "DELETE") return "Deleted";
  return "Updated";
}

function auditDesc(action: AuditAction, changes: Record<string, unknown>): string {
  if (action === "CREATE") return "Asset added to inventory";
  if (action === "DELETE") return "Asset removed from inventory";
  const fields = Object.keys(changes);
  if (fields.length === 0) return "Record updated";
  return `Updated ${fields.slice(0, 3).join(", ")}${fields.length > 3 ? ` +${fields.length - 3} more` : ""}`;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Skeleton({ w, h = 14 }: { w: number | string; h?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 4,
      background: "var(--elev)", animation: "pulse 1.5s ease-in-out infinite",
    }} />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [asset, setAsset] = useState<AssetWithRelations | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAsset = useCallback(async () => {
    try {
      const res = await fetch(`/api/assets/${params.id}`, { cache: "no-store" });
      const data: AssetDetailResponse = await res.json();
      if (data.ok) {
        setAsset(data.item);
        setAuditLogs(data.auditLogs);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchAsset(); }, [fetchAsset]);

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/assets/${params.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        toast.success("Asset deleted");
        router.push("/assets");
      } else {
        toast.error(data.error ?? "Failed to delete");
        setDeleteOpen(false);
      }
    } catch {
      toast.error("Failed to delete");
      setDeleteOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Skeleton w="100%" h={100} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14 }}>
            <Skeleton w="100%" h={320} />
            <Skeleton w="100%" h={320} />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !asset) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🔍</div>
          <div style={{ fontSize: 14, color: "var(--t2)", marginBottom: 16 }}>Asset not found</div>
          <Link href="/assets" style={{
            fontSize: 13, color: "var(--accent)", textDecoration: "none",
            border: "1px solid var(--b2)", borderRadius: 5, padding: "6px 14px",
          }}>← Back to Assets</Link>
        </div>
      </div>
    );
  }

  const expired = isExpired(asset.warrantyExpiry);

  const detailRows: [string, string, boolean][] = [
    ["Location", asset.location ? `${asset.location.building} / ${asset.location.room}` : "—", false],
    ["Assigned to", asset.assignedTo || "—", false],
    ["Serial number", asset.serialNumber || "—", true],
    ["Cost", fmtCurrency(asset.cost as string | number | null), false],
    ["Created", fmtDate(asset.createdAt), false],
    ["Warranty expiry", asset.warrantyExpiry ? fmtDate(asset.warrantyExpiry) : "—", false],
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ background: "var(--bg)" }}>

      {/* Breadcrumb bar */}
      <div style={{
        height: 48, padding: "0 24px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--b1)", background: "var(--surf)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Link href="/assets" style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 12, color: "var(--t3)", display: "flex", alignItems: "center", gap: 4,
            textDecoration: "none",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Assets
          </Link>
          <span style={{ color: "var(--b2)", fontSize: 13 }}>/</span>
          <span style={{ fontSize: 12, color: "var(--t1)", fontWeight: 500 }}>{asset.name}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setEditOpen(true)}
            style={{
              height: 30, padding: "0 11px", borderRadius: 5, border: "1px solid var(--b2)",
              background: "transparent", color: "var(--t1)", fontSize: 12, cursor: "pointer",
            }}
          >Edit</button>
          <button
            onClick={() => setDeleteOpen(true)}
            style={{
              height: 30, padding: "0 11px", borderRadius: 5, border: "none",
              background: "var(--err)", color: "white", fontSize: 12, cursor: "pointer",
            }}
          >Delete</button>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {/* Header card */}
        <div style={{
          padding: "16px 20px", marginBottom: 16, position: "relative", overflow: "hidden",
          background: "var(--surf)", border: "1px solid var(--b1)",
          borderRadius: 8, boxShadow: "var(--shadow)",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: asset.category?.color ?? "var(--accent)", borderRadius: "8px 8px 0 0" }} />
          <div style={{ marginBottom: 7 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--accent)", letterSpacing: "0.04em" }}>
              {asset.tag}
            </span>
          </div>
          <div style={{ fontSize: 22, color: "var(--t1)", fontWeight: 700, letterSpacing: "-0.025em", marginBottom: 10 }}>
            {asset.name}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <StatusPill status={asset.status as AssetStatus} />
            {asset.category && (
              <span style={{
                fontSize: 11, color: asset.category.color,
                background: `${asset.category.color}14`, border: `1px solid ${asset.category.color}30`,
                borderRadius: 3, padding: "2px 7px",
              }}>{asset.category.name}</span>
            )}
          </div>
        </div>

        {/* 2-col layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14 }}>

          {/* Left col */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Details table */}
            <div style={{ background: "var(--surf)", border: "1px solid var(--b1)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--b1)", fontSize: 10, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.09em" }}>
                Details
              </div>
              {detailRows.map(([k, v, mono], idx) => (
                <div key={k} style={{ display: "flex", alignItems: "baseline", padding: "9px 14px", borderBottom: idx < detailRows.length - 1 ? "1px solid var(--b1)" : "none" }}>
                  <div style={{ fontSize: 12, color: "var(--t3)", width: 160, flexShrink: 0 }}>{k}</div>
                  <div style={{
                    fontSize: 13, flex: 1,
                    fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
                    color: k === "Warranty expiry" && expired ? "var(--err)"
                         : k === "Cost" ? "var(--accent)"
                         : mono ? "var(--accent)"
                         : "var(--t1)",
                    fontWeight: k === "Cost" ? 600 : 400,
                  }}>
                    {v}
                    {k === "Warranty expiry" && expired && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: "var(--err)" }}>(⚠ expired)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            {asset.notes && (
              <div style={{ background: "var(--surf)", border: "1px solid var(--b1)", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--b1)", fontSize: 10, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.09em" }}>
                  Notes
                </div>
                <div style={{ padding: "12px 14px", fontSize: 13, color: "var(--t2)", lineHeight: 1.7 }}>
                  {asset.notes}
                </div>
              </div>
            )}
          </div>

          {/* Right col — audit timeline */}
          <div style={{ background: "var(--surf)", border: "1px solid var(--b1)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--b1)", fontSize: 10, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.09em" }}>
              Audit log
            </div>
            <div style={{ padding: "16px 14px", position: "relative" }}>
              {auditLogs.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--t3)", textAlign: "center", padding: "20px 0" }}>No audit entries</div>
              ) : (
                <>
                  <div style={{ position: "absolute", left: 22, top: 16, bottom: 16, width: 1, background: "var(--b2)" }} />
                  {auditLogs.map((entry, i) => (
                    <div key={entry.id} style={{ display: "flex", gap: 12, marginBottom: i < auditLogs.length - 1 ? 20 : 0, position: "relative" }}>
                      <div style={{
                        width: 17, height: 17, borderRadius: "50%", flexShrink: 0,
                        background: "var(--surf)",
                        border: `2px solid ${i === 0 ? "var(--accent)" : "var(--b2)"}`,
                        position: "relative", zIndex: 1, marginTop: 2,
                      }}>
                        {i === 0 && <div style={{ position: "absolute", inset: 3, borderRadius: "50%", background: "var(--accent)" }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "var(--t1)", fontWeight: 500, marginBottom: 2 }}>
                          {auditLabel(entry.action)}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 5, lineHeight: 1.4 }}>
                          {auditDesc(entry.action, entry.changes)}
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--t3)" }}>
                            {new Date(entry.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}
                          </span>
                          <span style={{
                            fontSize: 9, color: "var(--t3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em",
                            background: "var(--inset)", border: "1px solid var(--b1)",
                            borderRadius: 2, padding: "0 4px",
                          }}>{entry.user.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <AssetForm
        open={editOpen}
        asset={asset}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          fetchAsset();
        }}
      />

      {/* Delete confirm */}
      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Asset"
        description={`Are you sure you want to delete "${asset.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
