"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Location } from "@prisma/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLocationSchema } from "@/lib/validators";
import type { CreateLocationInput } from "@/lib/validators";
import { cn } from "@/lib/utils";

export interface LocationFormProps {
  location?: Location | null;
  open: boolean;
  onClose: () => void;
  onSaved: (location: Location) => void;
}

export function LocationForm({
  location,
  open,
  onClose,
  onSaved,
}: LocationFormProps) {
  const isEdit = !!location;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLocationInput>({
    resolver: zodResolver(createLocationSchema),
    defaultValues: {
      building: "",
      room: "",
      floor: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open && location) {
      reset({
        building: location.building,
        room: location.room,
        floor: location.floor,
        description: location.description ?? "",
      });
    } else if (!open) {
      reset({ building: "", room: "", floor: "", description: "" });
    }
  }, [open, location, reset]);

  async function onSubmit(values: CreateLocationInput) {
    try {
      const url = isEdit
        ? `/api/locations/${location.id}`
        : "/api/locations";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          description: values.description || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(isEdit ? "Location saved" : "Location created");
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
      title={isEdit ? "Edit Location" : "New Location"}
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
            {isEdit ? "Save Changes" : "Create Location"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Building *"
            placeholder="e.g. Headquarters"
            error={errors.building?.message}
            {...register("building")}
          />
          <Input
            label="Floor *"
            placeholder="e.g. 2"
            error={errors.floor?.message}
            {...register("floor")}
          />
        </div>

        <Input
          label="Room *"
          placeholder="e.g. Server Room"
          error={errors.room?.message}
          {...register("room")}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Optional description of this location…"
            className={cn(
              "input-base resize-none",
              errors.description && "border-[var(--danger)]"
            )}
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs text-[var(--danger)]">
              {errors.description.message}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
