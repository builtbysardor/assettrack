"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Search } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { Category } from "@prisma/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategorySchema } from "@/lib/validators";
import type { CreateCategoryInput } from "@/lib/validators";
import { cn } from "@/lib/utils";

// ─── Icon picker ──────────────────────────────────────────────────────────────

const ICON_NAMES = [
  "laptop",
  "monitor",
  "server",
  "network",
  "printer",
  "smartphone",
  "hard-drive",
  "router",
  "keyboard",
  "mouse",
  "camera",
  "headphones",
  "tablet",
  "cpu",
  "wifi",
  "shield",
  "database",
  "cloud",
  "package",
  "wrench",
];

function toPascalCase(name: string): string {
  return name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  error?: string;
}

function IconPicker({ value, onChange, error }: IconPickerProps) {
  const [search, setSearch] = useState("");
  const filtered = ICON_NAMES.filter((n) =>
    n.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[var(--text-secondary)]">
        Icon
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search icons…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base pl-8 text-sm"
        />
      </div>
      <div className="grid grid-cols-5 gap-1.5 max-h-44 overflow-y-auto pr-1">
        {filtered.map((name) => {
          const pascal = toPascalCase(name);
          const IconComponent = LucideIcons[
            pascal as keyof typeof LucideIcons
          ] as React.FC<{ size?: number }> | undefined;
          if (!IconComponent) return null;
          const selected = value === name;
          return (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => onChange(name)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all duration-100",
                selected
                  ? "border-[var(--brand-500)] bg-[var(--brand-500)]/10 ring-1 ring-[var(--brand-500)]/40 text-[var(--brand-400)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-inset)] text-[var(--text-tertiary)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]"
              )}
            >
              <IconComponent size={16} />
              <span className="text-[9px] leading-none truncate w-full text-center">
                {name}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-5 text-xs text-[var(--text-tertiary)] text-center py-4">
            No icons found
          </p>
        )}
      </div>
      {error && (
        <p className="text-xs text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Color picker ─────────────────────────────────────────────────────────────

const PALETTE = [
  "#8B5CF6",
  "#7C3AED",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#EF4444",
  "#F97316",
  "#06B6D4",
  "#84CC16",
  "#6366F1",
  "#14B8A6",
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  error?: string;
}

function ColorPicker({ value, onChange, error }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[var(--text-secondary)]">
        Color
      </label>
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((color) => {
          const selected = value === color;
          return (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => onChange(color)}
              className={cn(
                "w-7 h-7 rounded-full transition-all duration-100",
                selected
                  ? "ring-2 ring-offset-2 ring-offset-[var(--bg-elevated)] scale-110"
                  : "hover:scale-105"
              )}
              style={{
                backgroundColor: color,
                ...(selected ? { ringColor: color } : {}),
                outlineColor: selected ? color : undefined,
                outline: selected ? `2px solid ${color}` : undefined,
                outlineOffset: selected ? "2px" : undefined,
              }}
            />
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export interface CategoryFormProps {
  category?: Category | null;
  open: boolean;
  onClose: () => void;
  onSaved: (category: Category) => void;
}

export function CategoryForm({
  category,
  open,
  onClose,
  onSaved,
}: CategoryFormProps) {
  const isEdit = !!category;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      icon: "laptop",
      color: "#10B981",
    },
  });

  const icon = watch("icon");
  const color = watch("color");

  useEffect(() => {
    if (open && category) {
      reset({ name: category.name, icon: category.icon, color: category.color });
    } else if (!open) {
      reset({ name: "", icon: "laptop", color: "#10B981" });
    }
  }, [open, category, reset]);

  async function onSubmit(values: CreateCategoryInput) {
    try {
      const url = isEdit ? `/api/categories/${category.id}` : "/api/categories";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(isEdit ? "Category saved" : "Category created");
        onSaved(data.item);
        onClose();
      } else {
        toast.error(data.error ?? "Something went wrong");
      }
    } catch {
      toast.error("Network error — please try again");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Category" : "New Category"}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={isSubmitting}
            onClick={handleSubmit(onSubmit)}
          >
            {isEdit ? "Save Changes" : "Create Category"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          label="Name *"
          placeholder="e.g. Laptops"
          error={errors.name?.message}
          {...register("name")}
        />

        <IconPicker
          value={icon}
          onChange={(v) => setValue("icon", v, { shouldValidate: true })}
          error={errors.icon?.message}
        />

        <ColorPicker
          value={color}
          onChange={(v) => setValue("color", v, { shouldValidate: true })}
          error={errors.color?.message}
        />

        {/* Preview */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-inset)] border border-[var(--border-subtle)]">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm text-[var(--text-primary)]">
            {watch("name") || "Category Name"}
          </span>
        </div>
      </form>
    </Modal>
  );
}
