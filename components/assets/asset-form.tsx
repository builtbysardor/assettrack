"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Category, Location } from "@prisma/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createAssetSchema, updateAssetSchema } from "@/lib/validators";
import type { CreateAssetInput, UpdateAssetInput } from "@/lib/validators";
import type { AssetWithRelations } from "./asset-table";
import { cn } from "@/lib/utils";

// ─── Quick-Create modals ────────────────────────────────────────────────────

interface QuickCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (category: Category) => void;
}

function QuickCategoryModal({
  open,
  onClose,
  onCreated,
}: QuickCategoryModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), icon: "box", color: "#10B981" }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Category created");
        onCreated(data.item);
        setName("");
        onClose();
      } else {
        toast.error(data.error ?? "Failed to create category");
      }
    } catch {
      toast.error("Failed to create category");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => { setName(""); onClose(); }}
      title="New Category"
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={() => { setName(""); onClose(); }}>
            Cancel
          </Button>
          <Button size="sm" loading={loading} onClick={submit}>
            Create
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Input
          label="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Laptops"
          autoFocus
        />
      </form>
    </Modal>
  );
}

interface QuickLocationModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (location: Location) => void;
}

function QuickLocationModal({
  open,
  onClose,
  onCreated,
}: QuickLocationModalProps) {
  const [building, setBuilding] = useState("");
  const [room, setRoom] = useState("");
  const [floor, setFloor] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setBuilding("");
    setRoom("");
    setFloor("");
  }

  async function submit() {
    if (!building.trim() || !room.trim() || !floor.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          building: building.trim(),
          room: room.trim(),
          floor: floor.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Location created");
        onCreated(data.item);
        reset();
        onClose();
      } else {
        toast.error(data.error ?? "Failed to create location");
      }
    } catch {
      toast.error("Failed to create location");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="New Location"
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={() => { reset(); onClose(); }}>
            Cancel
          </Button>
          <Button size="sm" loading={loading} onClick={submit}>
            Create
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
        <Input
          label="Building"
          value={building}
          onChange={(e) => setBuilding(e.target.value)}
          placeholder="e.g. HQ"
          autoFocus
        />
        <Input
          label="Room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="e.g. Server Room"
        />
        <Input
          label="Floor"
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
          placeholder="e.g. 2"
        />
      </form>
    </Modal>
  );
}

// ─── Section divider ─────────────────────────────────────────────────────────

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          {title}
        </span>
        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
      </div>
      {children}
    </div>
  );
}

// ─── Status options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "RETIRED", label: "Retired" },
  { value: "MISSING", label: "Missing" },
];

// ─── Main form ────────────────────────────────────────────────────────────────

interface AssetFormProps {
  asset?: AssetWithRelations | null;
  open: boolean;
  onClose: () => void;
  onSaved: (asset: AssetWithRelations) => void;
}

type FormValues = CreateAssetInput;

export function AssetForm({ asset, open, onClose, onSaved }: AssetFormProps) {
  const isEdit = !!asset;

  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [quickCatOpen, setQuickCatOpen] = useState(false);
  const [quickLocOpen, setQuickLocOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateAssetSchema : createAssetSchema),
    defaultValues: {
      name: "",
      serialNumber: "",
      categoryId: "",
      locationId: "",
      assignedTo: "",
      status: "ACTIVE",
      purchaseDate: null,
      warrantyExpiry: null,
      cost: null,
      notes: "",
    },
  });

  // Load categories + locations once on mount
  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setCategories(d.items); })
      .catch(() => {});
    fetch("/api/locations", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setLocations(d.items); })
      .catch(() => {});
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (open && asset) {
      reset({
        name: asset.name,
        serialNumber: asset.serialNumber ?? "",
        categoryId: asset.categoryId,
        locationId: asset.locationId,
        assignedTo: asset.assignedTo ?? "",
        status: asset.status,
        purchaseDate: asset.purchaseDate
          ? format(new Date(asset.purchaseDate), "yyyy-MM-dd")
          : null,
        warrantyExpiry: asset.warrantyExpiry
          ? format(new Date(asset.warrantyExpiry), "yyyy-MM-dd")
          : null,
        cost: asset.cost ? Number(asset.cost) : null,
        notes: asset.notes ?? "",
      });
    } else if (!open) {
      reset({
        name: "",
        serialNumber: "",
        categoryId: "",
        locationId: "",
        assignedTo: "",
        status: "ACTIVE",
        purchaseDate: null,
        warrantyExpiry: null,
        cost: null,
        notes: "",
      });
      setServerError(null);
    }
  }, [open, asset, reset]);

  const categoryId = watch("categoryId");
  const locationId = watch("locationId");
  const status = watch("status");

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const url = isEdit ? `/api/assets/${asset.id}` : "/api/assets";
      const method = isEdit ? "PATCH" : "POST";

      // Clean up empty strings to null/undefined
      const payload = {
        ...values,
        serialNumber: values.serialNumber || null,
        assignedTo: values.assignedTo || null,
        purchaseDate: values.purchaseDate || null,
        warrantyExpiry: values.warrantyExpiry || null,
        notes: values.notes || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        toast.success(isEdit ? "Asset saved" : "Asset created");
        onSaved(data.item as AssetWithRelations);
        onClose();
      } else {
        setServerError(data.error ?? "Something went wrong");
      }
    } catch {
      setServerError("Network error — please try again");
    }
  }

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const locationOptions = locations.map((l) => ({
    value: l.id,
    label: `${l.building} / ${l.room}`,
  }));

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? `Edit ${asset.name}` : "New Asset"}
        description={
          isEdit
            ? `Tag: ${asset.tag}`
            : "Tag will be auto-generated"
        }
        size="xl"
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
              {isEdit ? "Save Changes" : "Create Asset"}
            </Button>
          </>
        }
      >
        {serverError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Identity */}
          <FormSection title="Identity">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Name *"
                placeholder="e.g. MacBook Pro 14""
                error={errors.name?.message}
                {...register("name")}
              />
              <Input
                label="Serial Number"
                placeholder="e.g. C02XG1JHJGH5"
                error={errors.serialNumber?.message}
                {...register("serialNumber")}
              />
            </div>
          </FormSection>

          {/* Classification */}
          <FormSection title="Classification">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Select
                  label="Category *"
                  placeholder="Select category"
                  options={categoryOptions}
                  value={categoryId}
                  onChange={(v) => setValue("categoryId", v, { shouldValidate: true })}
                  error={errors.categoryId?.message}
                />
                <button
                  type="button"
                  className="mt-1.5 text-xs text-[var(--brand-400)] hover:underline"
                  onClick={() => setQuickCatOpen(true)}
                >
                  + Create new category
                </button>
              </div>
              <Select
                label="Status *"
                placeholder="Select status"
                options={STATUS_OPTIONS}
                value={status}
                onChange={(v) =>
                  setValue("status", v as FormValues["status"], {
                    shouldValidate: true,
                  })
                }
                error={errors.status?.message}
              />
            </div>
          </FormSection>

          {/* Assignment */}
          <FormSection title="Assignment">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Select
                  label="Location *"
                  placeholder="Select location"
                  options={locationOptions}
                  value={locationId}
                  onChange={(v) =>
                    setValue("locationId", v, { shouldValidate: true })
                  }
                  error={errors.locationId?.message}
                />
                <button
                  type="button"
                  className="mt-1.5 text-xs text-[var(--brand-400)] hover:underline"
                  onClick={() => setQuickLocOpen(true)}
                >
                  + Create new location
                </button>
              </div>
              <Input
                label="Assigned To"
                placeholder="e.g. Jane Smith"
                error={errors.assignedTo?.message}
                {...register("assignedTo")}
              />
            </div>
          </FormSection>

          {/* Lifecycle */}
          <FormSection title="Lifecycle">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Purchase Date
                </label>
                <input
                  type="date"
                  className={cn(
                    "input-base",
                    errors.purchaseDate && "border-[var(--danger)]"
                  )}
                  {...register("purchaseDate")}
                />
                {errors.purchaseDate && (
                  <p className="text-xs text-[var(--danger)]">
                    {errors.purchaseDate.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Warranty Expiry
                </label>
                <input
                  type="date"
                  className={cn(
                    "input-base",
                    errors.warrantyExpiry && "border-[var(--danger)]"
                  )}
                  {...register("warrantyExpiry")}
                />
                {errors.warrantyExpiry && (
                  <p className="text-xs text-[var(--danger)]">
                    {errors.warrantyExpiry.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Cost
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm text-[var(--text-tertiary)] pointer-events-none">
                    €
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={cn(
                      "input-base pl-7",
                      errors.cost && "border-[var(--danger)]"
                    )}
                    {...register("cost", { valueAsNumber: true })}
                  />
                </div>
                {errors.cost && (
                  <p className="text-xs text-[var(--danger)]">
                    {errors.cost.message}
                  </p>
                )}
              </div>
            </div>
          </FormSection>

          {/* Notes */}
          <FormSection title="Notes">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                Notes
              </label>
              <textarea
                rows={3}
                placeholder="Any additional notes about this asset…"
                className={cn(
                  "input-base resize-none",
                  errors.notes && "border-[var(--danger)]"
                )}
                {...register("notes")}
              />
              {errors.notes && (
                <p className="text-xs text-[var(--danger)]">
                  {errors.notes.message}
                </p>
              )}
            </div>
          </FormSection>
        </form>
      </Modal>

      {/* Quick-create modals */}
      <QuickCategoryModal
        open={quickCatOpen}
        onClose={() => setQuickCatOpen(false)}
        onCreated={(cat) => {
          setCategories((prev) => [...prev, cat]);
          setValue("categoryId", cat.id, { shouldValidate: true });
        }}
      />
      <QuickLocationModal
        open={quickLocOpen}
        onClose={() => setQuickLocOpen(false)}
        onCreated={(loc) => {
          setLocations((prev) => [...prev, loc]);
          setValue("locationId", loc.id, { shouldValidate: true });
        }}
      />
    </>
  );
}
