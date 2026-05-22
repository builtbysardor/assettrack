"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Category } from "@prisma/client";
import TopBar from "@/components/layout/topbar";

type CategoryWithCount = Category & { _count: { assets: number } };

const COLOR_OPTIONS = [
  "#374151", "#0369A1", "#6D28D9", "#B45309",
  "#B91C1C", "#0F766E", "#92400E", "#1D4ED8",
  "#065F46", "#9D174D", "#1E3A5F", "#713F12",
];

// ── Card ─────────────────────────────────────────────────────────────────────

function CategoryCard({
  cat,
  onEdit,
  onDelete,
}: {
  cat: CategoryWithCount;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: 16,
        position: "relative",
        overflow: "hidden",
        background: "var(--surf)",
        border: `1px solid ${hov ? "var(--b2)" : "var(--b1)"}`,
        borderTop: `3px solid ${cat.color}`,
        borderRadius: 8,
        boxShadow: hov ? "var(--shadow-h)" : "var(--shadow)",
        transition: "all 0.14s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        {/* Swatch + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: cat.color,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "white", fontWeight: 700 }}>
              {cat.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 14, color: "var(--t1)", fontWeight: 600 }}>{cat.name}</div>
            <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 1 }}>{cat.icon}</div>
          </div>
        </div>

        {/* Actions — visible on hover */}
        <div style={{ display: "flex", gap: 4, opacity: hov ? 1 : 0, transition: "opacity 0.12s" }}>
          <button
            onClick={onEdit}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 5,
              background: "var(--elev)", border: "1px solid var(--b2)",
              cursor: "pointer", color: "var(--t2)",
            }}
            title="Edit"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            onClick={onDelete}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 5,
              background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)",
              cursor: "pointer", color: "var(--err)",
            }}
            title="Delete"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Asset count */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "var(--inset)", border: "1px solid var(--b1)",
        borderRadius: 5, padding: "4px 10px",
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--t1)", fontWeight: 600 }}>
          {cat._count.assets}
        </span>
        <span style={{ fontSize: 11, color: "var(--t3)" }}>assets</span>
      </div>
    </div>
  );
}

// ── Add placeholder ────────────────────────────────────────────────────────────

function AddCard({ onClick, label }: { onClick: () => void; label: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: `2px dashed ${hov ? "var(--b3)" : "var(--b2)"}`,
        borderRadius: 8, padding: "18px 20px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        cursor: "pointer", transition: "all 0.14s",
        background: hov ? "var(--elev)" : "transparent",
        color: hov ? "var(--t1)" : "var(--t3)",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ── Modal overlay ─────────────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(2px)",
        animation: "fadeIn 0.15s both",
      }}
    >
      <div style={{
        background: "var(--surf)",
        border: "1px solid var(--b1)",
        borderRadius: 8,
        boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        width: 440, maxWidth: "90vw",
        animation: "fadeSlideUp 0.2s both",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Category modal ────────────────────────────────────────────────────────────

const INP: React.CSSProperties = {
  width: "100%", height: 38, padding: "0 12px",
  background: "var(--inset)", border: "1px solid var(--b2)",
  borderRadius: 6, color: "var(--t1)", fontSize: 13, outline: "none",
};

function CategoryModal({
  mode,
  initial,
  onSave,
  onClose,
  loading,
}: {
  mode: "add" | "edit";
  initial?: CategoryWithCount;
  onSave: (data: { name: string; color: string; icon: string }) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? COLOR_OPTIONS[0]);
  const [err, setErr] = useState("");

  async function save() {
    if (!name.trim()) { setErr("Name is required"); return; }
    setErr("");
    await onSave({ name: name.trim(), color, icon: initial?.icon ?? "box" });
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", margin: 0 }}>
          {mode === "add" ? "New category" : "Edit category"}
        </h3>

        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--t2)", marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Laptop" style={INP} autoFocus />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--t2)", marginBottom: 8, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Color</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 26, height: 26, borderRadius: 6, background: c, border: "none",
                  cursor: "pointer", flexShrink: 0, position: "relative",
                  boxShadow: color === c ? `0 0 0 2px var(--surf), 0 0 0 4px ${c}` : "none",
                  transition: "box-shadow 0.12s",
                }}
              >
                {color === c && (
                  <svg style={{ position: "absolute", inset: 0, margin: "auto" }} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {err && <div style={{ fontSize: 12, color: "var(--err)" }}>{err}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
          <button onClick={onClose} style={{
            height: 30, padding: "0 11px", borderRadius: 5, border: "1px solid var(--b2)",
            background: "transparent", color: "var(--t1)", fontSize: 12, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={save} disabled={loading} style={{
            height: 30, padding: "0 11px", borderRadius: 5, border: "none",
            background: "var(--accent)", color: "white", fontSize: 12, fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
          }}>
            {loading ? "Saving…" : mode === "add" ? "Create" : "Save changes"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  title, body, confirmLabel, onConfirm, onClose, loading,
}: {
  title: string; body: string; confirmLabel: string;
  onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: 22 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", margin: "0 0 8px" }}>{title}</h3>
        <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.6, marginBottom: 20 }}>{body}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            height: 30, padding: "0 11px", borderRadius: 5, border: "1px solid var(--b2)",
            background: "transparent", color: "var(--t1)", fontSize: 12, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{
            height: 30, padding: "0 11px", borderRadius: 5, border: "none",
            background: "var(--err)", color: "white", fontSize: 12, fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
          }}>
            {loading ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; item: CategoryWithCount } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleting, setDeleting] = useState<CategoryWithCount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setCategories(data.items);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  async function handleSave(data: { name: string; color: string; icon: string }) {
    setModalLoading(true);
    try {
      if (modal?.mode === "add") {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.ok) {
          toast.success("Category created");
          setModal(null);
          fetchCategories();
        } else {
          toast.error(json.error ?? "Failed to create");
        }
      } else if (modal?.mode === "edit") {
        const res = await fetch(`/api/categories/${modal.item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.ok) {
          toast.success("Category updated");
          setModal(null);
          fetchCategories();
        } else {
          toast.error(json.error ?? "Failed to update");
        }
      }
    } catch {
      toast.error("Request failed");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/categories/${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        toast.success("Category deleted");
        setDeleting(null);
        fetchCategories();
      } else {
        const count = data.assetCount as number | undefined;
        if (count && count > 0) {
          toast.error(`Cannot delete — ${count} asset${count !== 1 ? "s" : ""} use this category. Reassign them first.`);
        } else {
          toast.error(data.error ?? "Failed to delete");
        }
        setDeleting(null);
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)", overflow: "hidden" }}>
      <TopBar
        title="Categories"
        subtitle={`${categories.length} categories`}
        actions={
          <button
            onClick={() => setModal({ mode: "add" })}
            style={{
              height: 30, padding: "0 11px", borderRadius: 5, border: "none",
              background: "var(--accent)", color: "white", fontSize: 12, fontWeight: 500,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New category
          </button>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 100, borderRadius: 8, background: "var(--elev)", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                onEdit={() => setModal({ mode: "edit", item: cat })}
                onDelete={() => setDeleting(cat)}
              />
            ))}
            <AddCard onClick={() => setModal({ mode: "add" })} label="Add category" />
          </div>
        )}
      </div>

      {modal && (
        <CategoryModal
          mode={modal.mode}
          initial={modal.mode === "edit" ? modal.item : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
          loading={modalLoading}
        />
      )}

      {deleting && (
        <ConfirmModal
          title="Delete category"
          body={`Are you sure you want to delete "${deleting.name}"? Assets in this category will become uncategorized.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
