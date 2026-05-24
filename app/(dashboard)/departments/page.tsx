"use client";

import { useEffect, useState } from "react";
import { Building2, Edit2, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Topbar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
} from "@/components/ui/modal";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  type CreateDepartmentInput,
  type UpdateDepartmentInput,
} from "@/lib/validators";

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  _count: { employees: number };
}

const LABEL: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--text-secondary)",
  display: "block",
  marginBottom: 5,
};

const ERR: React.CSSProperties = { fontSize: 11, color: "var(--err)", marginTop: 4 };
const FIELD: React.CSSProperties = { marginBottom: 14 };

const TEXTAREA: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  background: "var(--bg-inset)",
  border: "1px solid var(--border-default)",
  borderRadius: 7,
  color: "var(--text-primary)",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  resize: "none",
};

function DepartmentForm({
  mode,
  department,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  department?: Department;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  type FormValues = CreateDepartmentInput | UpdateDepartmentInput;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(mode === "create" ? createDepartmentSchema : updateDepartmentSchema),
    defaultValues: department
      ? { name: department.name, code: department.code, description: department.description ?? "" }
      : {},
  });

  async function onSubmit(values: FormValues) {
    try {
      const url =
        mode === "create" ? "/api/departments" : `/api/departments/${department!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Request failed");
      }
      toast.success(mode === "create" ? "Department created" : "Department updated");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={FIELD}>
        <label style={LABEL}>Name</label>
        <Input placeholder="Engineering" {...register("name")} />
        {errors.name && <p style={ERR}>{errors.name.message as string}</p>}
      </div>
      <div style={FIELD}>
        <label style={LABEL}>Code</label>
        <Input placeholder="ENG" {...register("code")} />
        {errors.code && <p style={ERR}>{errors.code.message as string}</p>}
      </div>
      <div style={FIELD}>
        <label style={LABEL}>Description</label>
        <textarea rows={3} style={TEXTAREA} placeholder="Optional description..." {...register("description")} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
          {mode === "create" ? "Create Department" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);

  async function fetchDepartments() {
    setLoading(true);
    try {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as Department[];
      setDepartments(data);
    } catch {
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchDepartments();
  }, []);

  async function handleDelete(dept: Department) {
    if (!confirm(`Delete "${dept.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/departments/${dept.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to delete");
      }
      toast.success(`${dept.name} deleted`);
      void fetchDepartments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="Departments" />
      <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
            {loading ? "Loading..." : `${departments.length} department${departments.length !== 1 ? "s" : ""}`}
          </p>
          <Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
            Add Department
          </Button>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} style={{ height: 144 }} />
            ))}
          </div>
        ) : departments.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12 }}>
            <Building2 size={40} style={{ color: "var(--text-disabled)" }} />
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>No departments yet</p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Create your first department to get started</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="card-hover"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 8,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxShadow: "var(--shadow)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{dept.name}</p>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-tertiary)",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 4,
                      padding: "2px 6px",
                      fontFamily: "'JetBrains Mono', monospace",
                      flexShrink: 0,
                    }}
                  >
                    {dept.code}
                  </span>
                </div>
                {dept.description && (
                  <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>
                    {dept.description}
                  </p>
                )}
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, flex: 1 }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{dept._count.employees}</span>
                  {" "}{dept._count.employees === 1 ? "employee" : "employees"}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    style={{ flex: 1 }}
                    leftIcon={<Edit2 size={12} />}
                    onClick={() => setEditDept(dept)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ color: "var(--err)" }}
                    onClick={() => handleDelete(dept)}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={addOpen} onOpenChange={setAddOpen}>
        <ModalContent open={addOpen}>
          <ModalHeader>
            <ModalTitle>Add Department</ModalTitle>
            <ModalDescription>Create a new department in your organization.</ModalDescription>
          </ModalHeader>
          <ModalBody>
            <DepartmentForm
              mode="create"
              onSuccess={() => { setAddOpen(false); void fetchDepartments(); }}
              onCancel={() => setAddOpen(false)}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {editDept && (
        <Modal open={!!editDept} onOpenChange={(open) => { if (!open) setEditDept(null); }}>
          <ModalContent open={!!editDept}>
            <ModalHeader>
              <ModalTitle>Edit Department</ModalTitle>
              <ModalDescription>Update the details for {editDept.name}.</ModalDescription>
            </ModalHeader>
            <ModalBody>
              <DepartmentForm
                mode="edit"
                department={editDept}
                onSuccess={() => { setEditDept(null); void fetchDepartments(); }}
                onCancel={() => setEditDept(null)}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
