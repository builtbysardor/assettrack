"use client";

import { useEffect, useState } from "react";
import type { AuditLog } from "@prisma/client";
import { AlertTriangle } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDate, formatCurrency, isWarrantyExpired, cn } from "@/lib/utils";
import type { AssetWithRelations } from "./asset-table";

type AuditLogWithUser = AuditLog & {
  user: { name: string; email: string };
};

interface AssetDetailDrawerProps {
  assetId: string | null;
  onClose: () => void;
  onEdit: (asset: AssetWithRelations) => void;
  onDelete: (asset: AssetWithRelations) => void;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
  );
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-[var(--text-tertiary)] mb-0.5">{label}</p>
      <p className="text-sm text-[var(--text-primary)]">{children}</p>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const variants: Record<string, { bg: string; text: string }> = {
    CREATE: { bg: "rgba(16,185,129,0.12)", text: "#10B981" },
    UPDATE: { bg: "rgba(14,165,233,0.12)", text: "#0EA5E9" },
    DELETE: { bg: "rgba(239,68,68,0.12)", text: "#EF4444" },
  };
  const v = variants[action] ?? { bg: "rgba(107,123,118,0.12)", text: "#A3B1AC" };
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: v.bg, color: v.text }}
    >
      {action}
    </span>
  );
}

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-48 rounded bg-[var(--bg-elevated)]" />
          <div className="h-4 w-24 rounded bg-[var(--bg-elevated)]" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-16 rounded bg-[var(--bg-elevated)]" />
          <div className="h-8 w-16 rounded bg-[var(--bg-elevated)]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-16 rounded bg-[var(--bg-elevated)]" />
            <div className="h-4 w-28 rounded bg-[var(--bg-elevated)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AssetDetailDrawer({
  assetId,
  onClose,
  onEdit,
  onDelete,
}: AssetDetailDrawerProps) {
  const [asset, setAsset] = useState<AssetWithRelations | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) {
      setAsset(null);
      setAuditLogs([]);
      return;
    }

    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [assetRes, auditRes] = await Promise.all([
          fetch(`/api/assets/${assetId}`, { cache: "no-store" }),
          fetch(`/api/audit?entity=Asset&entityId=${assetId}`, {
            cache: "no-store",
          }),
        ]);

        const assetData = await assetRes.json();
        const auditData = await auditRes.json();

        if (cancelled) return;

        if (assetData.ok) {
          setAsset(assetData.item);
        } else {
          setError(assetData.error ?? "Failed to load asset");
        }

        if (auditData.ok) {
          setAuditLogs(auditData.items ?? []);
        }
      } catch {
        if (!cancelled) setError("Failed to load asset");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  const warrantyExpired = asset?.warrantyExpiry
    ? isWarrantyExpired(asset.warrantyExpiry)
    : false;

  return (
    <Drawer
      open={!!assetId}
      onClose={onClose}
      title={asset?.name ?? "Asset Details"}
      footer={
        asset ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(asset)}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(asset)}
            >
              Delete
            </Button>
          </>
        ) : undefined
      }
    >
      {loading ? (
        <SkeletonDetail />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertTriangle className="w-8 h-8 text-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-secondary)]">{error}</p>
        </div>
      ) : asset ? (
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-6 pb-6 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {asset.name}
              </h2>
              <p className="font-mono text-xs text-[var(--brand-400)] mt-0.5">
                {asset.tag}
              </p>
              <div className="mt-2">
                <StatusPill status={asset.status} />
              </div>
            </div>
          </div>

          {/* Warranty warning */}
          {warrantyExpired && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-400">Warranty has expired</p>
            </div>
          )}

          {/* Asset Details */}
          <Section title="Asset Details">
            <DetailGrid>
              <DetailItem label="Serial Number">
                {asset.serialNumber ? (
                  <span className="font-mono text-xs">{asset.serialNumber}</span>
                ) : (
                  <span className="text-[var(--text-tertiary)]">—</span>
                )}
              </DetailItem>
              <DetailItem label="Category">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: asset.category.color }}
                  />
                  {asset.category.name}
                </span>
              </DetailItem>
              <DetailItem label="Location">
                {`${asset.location.building}${asset.location.room ? ` / ${asset.location.room}` : ""}${asset.location.floor ? ` (Floor ${asset.location.floor})` : ""}`}
              </DetailItem>
              <DetailItem label="Assigned To">
                {asset.assignedTo ?? (
                  <span className="text-[var(--text-tertiary)]">—</span>
                )}
              </DetailItem>
            </DetailGrid>
          </Section>

          {/* Lifecycle */}
          <Section title="Lifecycle">
            <DetailGrid>
              <DetailItem label="Purchase Date">
                {formatDate(asset.purchaseDate) ?? (
                  <span className="text-[var(--text-tertiary)]">—</span>
                )}
              </DetailItem>
              <DetailItem label="Warranty Expiry">
                <span
                  className={cn(
                    warrantyExpired
                      ? "text-red-400"
                      : "text-[var(--text-primary)]"
                  )}
                >
                  {formatDate(asset.warrantyExpiry) ?? (
                    <span className="text-[var(--text-tertiary)]">—</span>
                  )}
                </span>
              </DetailItem>
              <DetailItem label="Cost">
                {formatCurrency(
                  asset.cost ? Number(asset.cost) : null
                )}
              </DetailItem>
              <DetailItem label="Added">
                {formatDate(asset.createdAt)}
              </DetailItem>
            </DetailGrid>
          </Section>

          {/* Notes */}
          {asset.notes && (
            <Section title="Notes">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap bg-[var(--bg-inset)] rounded-lg px-4 py-3 border border-[var(--border-subtle)]">
                {asset.notes}
              </p>
            </Section>
          )}

          {/* Audit History */}
          <Section title="Audit History">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">
                No history yet.
              </p>
            ) : (
              <div className="space-y-3">
                {[...auditLogs]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((log) => (
                    <div
                      key={log.id}
                      className="flex gap-3 pb-3 border-b border-[var(--border-subtle)] last:border-0"
                    >
                      <div className="mt-0.5">
                        <ActionBadge action={log.action} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {log.user?.name ?? log.user?.email ?? "System"}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        {log.changes && (
                          <p className="text-xs text-[var(--text-tertiary)] mt-0.5 leading-relaxed">
                            {typeof log.changes === "string"
                              ? log.changes
                              : JSON.stringify(log.changes)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Section>
        </div>
      ) : null}
    </Drawer>
  );
}
