"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Location } from "@prisma/client";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { LocationForm } from "@/components/locations/location-form";

type LocationWithCount = Location & { _count: { assets: number } };

function SkeletonRow() {
  return (
    <tr className="border-b border-[var(--border-subtle)]">
      {[120, 100, 60, 180, 60, 80].map((w, i) => (
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

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] =
    useState<LocationWithCount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/locations", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setLocations(data.items);
      } else {
        setError("Failed to load locations");
      }
    } catch {
      setError("Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  async function handleDelete() {
    if (!deletingLocation) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/locations/${deletingLocation.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Location deleted");
        setDeletingLocation(null);
        fetchLocations();
      } else {
        const count = data.assetCount as number | undefined;
        if (count && count > 0) {
          toast.error(
            `Cannot delete — ${count} asset${count !== 1 ? "s" : ""} are assigned to this location. Reassign them first.`
          );
        } else {
          toast.error(data.error ?? "Failed to delete location");
        }
        setDeletingLocation(null);
      }
    } catch {
      toast.error("Failed to delete location");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Locations"
        subtitle="Manage asset locations"
        actions={
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingLocation(null);
              setFormOpen(true);
            }}
          >
            New Location
          </Button>
        }
      />

      <div className="flex-1 overflow-auto px-6 py-5">
        {error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchLocations}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-inset)]">
                <tr>
                  {[
                    "Building",
                    "Room",
                    "Floor",
                    "Description",
                    "Assets",
                    "Actions",
                  ].map((h) => (
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
                ) : locations.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        title="No locations yet"
                        description="Create a location to start assigning assets."
                        action={
                          <Button
                            size="sm"
                            leftIcon={<Plus className="w-4 h-4" />}
                            onClick={() => {
                              setEditingLocation(null);
                              setFormOpen(true);
                            }}
                          >
                            New Location
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  locations.map((loc) => (
                    <tr
                      key={loc.id}
                      className="group border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors duration-100"
                    >
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                        {loc.building}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {loc.room}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {loc.floor}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] max-w-xs">
                        {loc.description ? (
                          <span className="truncate block max-w-[240px]">
                            {loc.description}
                          </span>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {loc._count.assets}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              setEditingLocation(loc);
                              setFormOpen(true);
                            }}
                            aria-label="Edit location"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setDeletingLocation(loc)}
                            aria-label="Delete location"
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
      <LocationForm
        open={formOpen}
        location={editingLocation}
        onClose={() => {
          setFormOpen(false);
          setEditingLocation(null);
        }}
        onSaved={() => {
          setFormOpen(false);
          setEditingLocation(null);
          fetchLocations();
        }}
      />

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deletingLocation}
        onClose={() => setDeletingLocation(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Location"
        description={
          deletingLocation
            ? deletingLocation._count.assets > 0
              ? `"${deletingLocation.building} / ${deletingLocation.room}" has ${deletingLocation._count.assets} asset${deletingLocation._count.assets !== 1 ? "s" : ""} assigned. Reassign them before deleting.`
              : `Are you sure you want to delete "${deletingLocation.building} / ${deletingLocation.room}"?`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
