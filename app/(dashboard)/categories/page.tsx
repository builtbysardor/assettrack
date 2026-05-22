"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@prisma/client";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryForm } from "@/components/categories/category-form";

type CategoryWithCount = Category & { _count: { assets: number } };

function toPascalCase(name: string): string {
  return name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

function CategoryIcon({ name, color }: { name: string; color: string }) {
  const pascal = toPascalCase(name);
  const IconComponent = LucideIcons[
    pascal as keyof typeof LucideIcons
  ] as React.FC<{ size?: number }> | undefined;
  if (!IconComponent) return null;
  return <IconComponent size={16} />;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[var(--border-subtle)]">
      {[32, 24, 140, 60, 80].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-3.5 rounded animate-pulse bg-[var(--bg-elevated)]"
            style={{ width: w }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] =
    useState<CategoryWithCount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setCategories(data.items);
      } else {
        setError("Failed to load categories");
      }
    } catch {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function handleDelete() {
    if (!deletingCategory) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Category deleted");
        setDeletingCategory(null);
        fetchCategories();
      } else {
        const count = data.assetCount as number | undefined;
        if (count && count > 0) {
          toast.error(
            `Cannot delete — ${count} asset${count !== 1 ? "s" : ""} use this category. Reassign them first.`
          );
        } else {
          toast.error(data.error ?? "Failed to delete category");
        }
        setDeletingCategory(null);
      }
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Categories"
        subtitle="Manage asset categories"
        actions={
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingCategory(null);
              setFormOpen(true);
            }}
          >
            New Category
          </Button>
        }
      />

      <div className="flex-1 overflow-auto px-6 py-5">
        {error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchCategories}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-inset)]">
                <tr>
                  {["Icon", "Color", "Name", "Assets", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        title="No categories yet"
                        description="Create a category to start organizing your assets."
                        action={
                          <Button
                            size="sm"
                            leftIcon={<Plus className="w-4 h-4" />}
                            onClick={() => {
                              setEditingCategory(null);
                              setFormOpen(true);
                            }}
                          >
                            New Category
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr
                      key={cat.id}
                      className="group border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors duration-100"
                    >
                      <td className="px-4 py-3">
                        <span
                          className="flex items-center justify-center w-7 h-7 rounded-lg"
                          style={{
                            backgroundColor: `${cat.color}20`,
                            color: cat.color,
                          }}
                        >
                          <CategoryIcon name={cat.icon} color={cat.color} />
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="block w-5 h-5 rounded-full border-2 border-[var(--bg-elevated)]"
                          style={{ backgroundColor: cat.color }}
                          title={cat.color}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                        {cat.name}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {cat._count.assets}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              setEditingCategory(cat);
                              setFormOpen(true);
                            }}
                            aria-label="Edit category"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setDeletingCategory(cat)}
                            aria-label="Delete category"
                            className="hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / edit form */}
      <CategoryForm
        open={formOpen}
        category={editingCategory}
        onClose={() => {
          setFormOpen(false);
          setEditingCategory(null);
        }}
        onSaved={() => {
          setFormOpen(false);
          setEditingCategory(null);
          fetchCategories();
        }}
      />

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Category"
        description={
          deletingCategory
            ? deletingCategory._count.assets > 0
              ? `"${deletingCategory.name}" has ${deletingCategory._count.assets} asset${deletingCategory._count.assets !== 1 ? "s" : ""} assigned. You must reassign them before deleting.`
              : `Are you sure you want to delete "${deletingCategory.name}"?`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
