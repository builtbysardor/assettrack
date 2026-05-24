"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
} from "@/lib/validators";

interface Department {
  id: string;
  name: string;
}

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
}

interface EmployeeData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  departmentId: string;
  position: string;
  managerId?: string | null;
  startDate: string;
  notes?: string | null;
}

interface EmployeeFormProps {
  mode: "create" | "edit";
  employee?: EmployeeData;
  onSuccess: () => void;
  onCancel: () => void;
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

const INP: React.CSSProperties = {
  height: 40,
  padding: "0 10px",
  background: "var(--bg-inset)",
  border: "1px solid var(--border-default)",
  borderRadius: 7,
  fontSize: 13,
  color: "var(--text-primary)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const SEL: React.CSSProperties = {
  ...INP,
  paddingRight: 28,
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238A8A84' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
  cursor: "pointer",
};

const TEXTAREA: React.CSSProperties = {
  ...INP,
  height: "auto",
  padding: "8px 10px",
  resize: "none",
};

export function EmployeeForm({ mode, employee, onSuccess, onCancel }: EmployeeFormProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const schema = mode === "create" ? createEmployeeSchema : updateEmployeeSchema;
  type FormValues = CreateEmployeeInput | UpdateEmployeeInput;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: employee
      ? {
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone ?? "",
          departmentId: employee.departmentId,
          position: employee.position,
          managerId: employee.managerId ?? "",
          startDate: employee.startDate
            ? new Date(employee.startDate).toISOString().split("T")[0]
            : "",
          notes: employee.notes ?? "",
        }
      : {},
  });

  const departmentId = watch("departmentId");
  const managerId = watch("managerId");

  useEffect(() => {
    async function fetchRefs() {
      try {
        const [deptRes, mgrRes] = await Promise.all([
          fetch("/api/departments"),
          fetch("/api/employees?status=ACTIVE&pageSize=100"),
        ]);
        if (deptRes.ok) {
          const depts = (await deptRes.json()) as Department[];
          setDepartments(depts);
        }
        if (mgrRes.ok) {
          const mgrData = (await mgrRes.json()) as { data: Manager[] };
          setManagers(mgrData.data ?? []);
        }
      } catch {
        toast.error("Failed to load form data");
      } finally {
        setLoadingRefs(false);
      }
    }
    void fetchRefs();
  }, []);

  async function onSubmit(values: FormValues) {
    try {
      const url =
        mode === "create" ? "/api/employees" : `/api/employees/${employee!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const payload = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === "" ? null : v])
      );

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Request failed");
      }

      toast.success(
        mode === "create" ? "Employee created successfully" : "Employee updated successfully"
      );
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    }
  }

  const btnPrimary: React.CSSProperties = {
    height: 36,
    padding: "0 16px",
    background: "var(--accent)",
    color: "var(--bg-surface)",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 500,
    cursor: isSubmitting ? "not-allowed" : "pointer",
    opacity: isSubmitting ? 0.6 : 1,
    fontFamily: "inherit",
  };

  const btnSecondary: React.CSSProperties = {
    height: 36,
    padding: "0 16px",
    background: "var(--bg-elevated)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-default)",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={LABEL}>First Name</label>
          <input placeholder="John" style={INP} {...register("firstName")} />
          {errors.firstName && <p style={ERR}>{errors.firstName.message as string}</p>}
        </div>
        <div>
          <label style={LABEL}>Last Name</label>
          <input placeholder="Doe" style={INP} {...register("lastName")} />
          {errors.lastName && <p style={ERR}>{errors.lastName.message as string}</p>}
        </div>
      </div>

      <div style={FIELD}>
        <label style={LABEL}>Email</label>
        <input type="email" placeholder="john.doe@company.com" style={INP} {...register("email")} />
        {errors.email && <p style={ERR}>{errors.email.message as string}</p>}
      </div>

      <div style={FIELD}>
        <label style={LABEL}>Phone</label>
        <input type="tel" placeholder="+1 (555) 000-0000" style={INP} {...register("phone")} />
      </div>

      <div style={FIELD}>
        <label style={LABEL}>Department</label>
        <select
          style={SEL}
          disabled={loadingRefs}
          value={(departmentId as string) ?? ""}
          onChange={(e) =>
            setValue("departmentId" as keyof FormValues, e.target.value as never)
          }
        >
          <option value="">{loadingRefs ? "Loading…" : "Select department"}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        {errors.departmentId && (
          <p style={ERR}>{errors.departmentId.message as string}</p>
        )}
      </div>

      <div style={FIELD}>
        <label style={LABEL}>Position</label>
        <input placeholder="Software Engineer" style={INP} {...register("position")} />
        {errors.position && <p style={ERR}>{errors.position.message as string}</p>}
      </div>

      <div style={FIELD}>
        <label style={LABEL}>Manager</label>
        <select
          style={SEL}
          disabled={loadingRefs}
          value={(managerId as string) ?? ""}
          onChange={(e) =>
            setValue(
              "managerId" as keyof FormValues,
              (e.target.value === "__none__" ? null : e.target.value) as never
            )
          }
        >
          <option value="">{loadingRefs ? "Loading…" : "Select manager (optional)"}</option>
          <option value="__none__">No manager</option>
          {managers
            .filter((m) => m.id !== employee?.id)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName} — {m.position}
              </option>
            ))}
        </select>
      </div>

      <div style={FIELD}>
        <label style={LABEL}>Start Date</label>
        <input type="date" style={INP} {...register("startDate")} />
        {errors.startDate && <p style={ERR}>{errors.startDate.message as string}</p>}
      </div>

      <div style={FIELD}>
        <label style={LABEL}>Notes</label>
        <textarea
          style={TEXTAREA}
          rows={3}
          placeholder="Any additional notes…"
          {...register("notes")}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
        <button type="button" style={btnSecondary} onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" style={btnPrimary} disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : mode === "create" ? "Create Employee" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
