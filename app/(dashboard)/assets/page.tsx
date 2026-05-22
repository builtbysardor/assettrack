"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Download, ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@prisma/client";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { AssetTable } from "@/components/assets/asset-table";
import { AssetCard } from "@/components/assets/asset-card";
import { AssetDetailDrawer } from "@/components/assets/asset-detail-drawer";
import { AssetForm } from "@/components/assets/asset-form";
import type { AssetWithRelations } from "@/components/assets/asset-table";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "RETIRED", label: "Retired" },
  { value: "MISSING", label: "Missing" },
];

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 / page" },
  { value: "25", label: "25 / page" },
  { value: "50", label: "50 / page" },
];

interface AssetsApiResponse {
  ok: boolean;
  items: AssetWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function AssetsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive state from URL
  const searchParam = searchParams.get("search") ?? "";
  const statusParam = searchParams.get("status") ?? "";
  const categoryParam = searchParams.get("categoryId") ?? "";
  const pageParam = Number(searchParams.get("page") ?? "1");
  const pageSizeParam = Number(searchParams.get("pageSize") ?? "25");

  // Local search input (debounced)
  const [searchInput, setSearchInput] = useState(searchParam);

  const [assets, setAssets] = useState<AssetWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cardView, setCardView] = useState(false);

  // Modal/drawer state
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<AssetWithRelations | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<AssetWithRelations | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value, page: "1" });
    }, 250);
  }

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.replace(`/assets?${params.toString()}`);
  }

  // Fetch categories for filter dropdown
  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setCategories(d.items); })
      .catch(() => {});
  }, []);

  // Fetch assets when URL params change
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchParam) params.set("search", searchParam);
      if (statusParam) params.set("status", statusParam);
      if (categoryParam) params.set("categoryId", categoryParam);
      params.set("page", String(pageParam));
      params.set("pageSize", String(pageSizeParam));

      const res = await fetch(`/api/assets?${params.toString()}`, {
        cache: "no-store",
      });
      const data: AssetsApiResponse = await res.json();
      if (data.ok) {
        setAssets(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [searchParam, statusParam, categoryParam, pageParam, pageSizeParam]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  async function handleDelete() {
    if (!deletingAsset) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/assets/${deletingAsset.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Asset deleted");
        setDeletingAsset(null);
        // Close drawer if same asset was open
        if (selectedAssetId === deletingAsset.id) setSelectedAssetId(null);
        fetchAssets();
      } else {
        toast.error(data.error ?? "Failed to delete asset");
      }
    } catch {
      toast.error("Failed to delete asset");
    } finally {
      setDeleteLoading(false);
    }
  }

  const categoryFilterOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  // Export CSV URL
  const exportParams = new URLSearchParams();
  if (searchParam) exportParams.set("search", searchParam);
  if (statusParam) exportParams.set("status", statusParam);
  if (categoryParam) exportParams.set("categoryId", categoryParam);
  const exportUrl = `/api/assets/export?${exportParams.toString()}`;

  const pageStart = (pageParam - 1) * pageSizeParam + 1;
  const pageEnd = Math.min(pageParam * pageSizeParam, total);

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Assets"
        subtitle="Manage your IT inventory"
        actions={
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingAsset(null);
              setFormOpen(true);
            }}
          >
            New Asset
          </Button>
        }
      />

      {/* Sticky toolbar */}
      <div className="sticky top-[73px] z-10 flex flex-wrap items-center gap-3 px-6 py-3 border-b border-[var(--border-subtle)]" style={{ background: "var(--bg-base)" }}>
        <div className="w-64">
          <Input
            placeholder="Search assets…"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="w-44">
          <Select
            placeholder="All Statuses"
            options={STATUS_OPTIONS}
            value={statusParam}
            onChange={(v) => updateParams({ status: v, page: "1" })}
          />
        </div>
        <div className="w-48">
          <Select
            placeholder="All Categories"
            options={categoryFilterOptions}
            value={categoryParam}
            onChange={(v) => updateParams({ categoryId: v, page: "1" })}
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {/* View toggle */}
          <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: "1px solid var(--border-default)" }}>
            <button
              onClick={() => setCardView(false)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 30, background: !cardView ? "var(--bg-elevated)" : "var(--bg-surface)",
                border: "none", cursor: "pointer", color: !cardView ? "var(--text-primary)" : "var(--text-tertiary)",
                borderRight: "1px solid var(--border-default)", transition: "all 0.12s",
              }}
              title="Table view"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setCardView(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 30, background: cardView ? "var(--bg-elevated)" : "var(--bg-surface)",
                border: "none", cursor: "pointer", color: cardView ? "var(--text-primary)" : "var(--text-tertiary)",
                transition: "all 0.12s",
              }}
              title="Card view"
            >
              <LayoutGrid size={14} />
            </button>
          </div>

          <a href={exportUrl} download>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Table or Card grid */}
      <div className="flex-1 overflow-auto">
        {cardView ? (
          <div style={{ padding: 20 }}>
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))", gap: 12 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ height: 140, borderRadius: 8, background: "var(--bg-elevated)", animation: "pulse 1.5s ease-in-out infinite" }} />
                ))}
              </div>
            ) : assets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-tertiary)", fontSize: 14 }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🔍</div>
                No assets found — try adjusting your filters
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))", gap: 12 }}>
                {assets.map((a) => (
                  <AssetCard
                    key={a.id}
                    asset={a}
                    onClick={() => setSelectedAssetId(a.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <AssetTable
            data={assets}
            isLoading={loading}
            onRowClick={(a) => setSelectedAssetId(a.id)}
            onEdit={(a) => {
              setEditingAsset(a);
              setFormOpen(true);
            }}
            onDelete={(a) => setDeletingAsset(a)}
          />
        )}
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-tertiary)]">
            Showing{" "}
            <span className="text-[var(--text-secondary)]">
              {pageStart}–{pageEnd}
            </span>{" "}
            of{" "}
            <span className="text-[var(--text-secondary)]">{total}</span> assets
          </p>

          <div className="flex items-center gap-2">
            <div className="w-32">
              <Select
                options={PAGE_SIZE_OPTIONS}
                value={String(pageSizeParam)}
                onChange={(v) => updateParams({ pageSize: v, page: "1" })}
              />
            </div>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                disabled={pageParam <= 1}
                onClick={() => updateParams({ page: String(pageParam - 1) })}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pageParam <= 3) {
                  pageNum = i + 1;
                } else if (pageParam >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = pageParam - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pageParam ? "primary" : "secondary"}
                    size="sm"
                    className="w-8 px-0"
                    onClick={() =>
                      updateParams({ page: String(pageNum) })
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="secondary"
                size="sm"
                disabled={pageParam >= totalPages}
                onClick={() => updateParams({ page: String(pageParam + 1) })}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      <AssetDetailDrawer
        assetId={selectedAssetId}
        onClose={() => setSelectedAssetId(null)}
        onEdit={(a) => {
          setEditingAsset(a);
          setFormOpen(true);
        }}
        onDelete={(a) => setDeletingAsset(a)}
      />

      {/* Create/edit form */}
      <AssetForm
        open={formOpen}
        asset={editingAsset}
        onClose={() => {
          setFormOpen(false);
          setEditingAsset(null);
        }}
        onSaved={() => {
          setFormOpen(false);
          setEditingAsset(null);
          fetchAssets();
        }}
      />

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deletingAsset}
        onClose={() => setDeletingAsset(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Asset"
        description={`Are you sure you want to delete "${deletingAsset?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

export default function AssetsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--text-tertiary)]">Loading assets…</div>}>
      <AssetsContent />
    </Suspense>
  );
}
