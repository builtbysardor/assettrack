"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Search, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/layout/topbar";
import { EmployeeStatusPill, type EmployeeStatus } from "@/components/ui/employee-status";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddEmployeeDialog } from "@/components/employees/add-employee-dialog";
import { EditEmployeeDialog } from "@/components/employees/edit-employee-dialog";
import { getInitials, formatDate } from "@/lib/utils";

const INP: React.CSSProperties = {
  height: 36, padding: "0 12px", background: "var(--bg-inset)",
  border: "1px solid var(--border-default)", borderRadius: 7,
  color: "var(--text-primary)", fontSize: 13, outline: "none", fontFamily: "inherit",
};
const SEL: React.CSSProperties = { height: 36, padding: "0 10px", background: "var(--bg-inset)", border: "1px solid var(--border-default)", borderRadius: 7, color: "var(--text-primary)", fontSize: 13, outline: "none", fontFamily: "inherit", cursor: "pointer" };

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  position: string;
  status: EmployeeStatus;
  startDate: string;
  departmentId: string;
  managerId?: string | null;
  notes?: string | null;
  department: { name: string; code: string };
  manager?: { firstName: string; lastName: string } | null;
}

interface Department {
  id: string;
  name: string;
}

interface EmployeesResponse {
  data: Employee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const PAGE_SIZE = 25;

function RowMenu({ emp, onEdit, onDelete, onStartOnboarding, onStartOffboarding }: {
  emp: Employee;
  onEdit: () => void;
  onDelete: () => void;
  onStartOnboarding: () => void;
  onStartOffboarding: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <Button
        variant="ghost"
        size="sm"
        style={{ width: 28, height: 28, padding: 0, color: "var(--text-tertiary)" }}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
      >
        <MoreHorizontal size={14} />
      </Button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 4px)", minWidth: 160,
          background: "var(--bg-surface)", border: "1px solid var(--border-default)",
          borderRadius: 8, boxShadow: "var(--shadow-h)", zIndex: 50, padding: 4,
        }}>
          {[
            { label: "View", action: () => { router.push(`/employees/${emp.id}`); setOpen(false); } },
            { label: "Edit", action: () => { onEdit(); setOpen(false); } },
            ...(emp.status === "PENDING" ? [{ label: "Start Onboarding", action: () => { onStartOnboarding(); setOpen(false); } }] : []),
            ...(emp.status === "ACTIVE" ? [{ label: "Start Offboarding", action: () => { onStartOffboarding(); setOpen(false); } }] : []),
          ].map((item) => (
            <MenuBtn key={item.label} label={item.label} onClick={item.action} />
          ))}
          <div style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />
          <MenuBtn label="Delete" onClick={() => { onDelete(); setOpen(false); }} danger />
        </div>
      )}
    </div>
  );
}

function MenuBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block", width: "100%", padding: "7px 12px", borderRadius: 5,
        border: "none", background: hovered ? (danger ? "rgba(220,38,38,0.08)" : "var(--bg-elevated)") : "transparent",
        color: danger ? "var(--err)" : "var(--text-primary)", fontSize: 13, cursor: "pointer", textAlign: "left",
      }}
    >
      {label}
    </button>
  );
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search]);

  useEffect(() => {
    async function fetchDepts() {
      try {
        const res = await fetch("/api/departments");
        if (res.ok) setDepartments((await res.json()) as Department[]);
      } catch { /* non-critical */ }
    }
    void fetchDepts();
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (status !== "all") params.set("status", status);
      if (departmentId !== "all") params.set("departmentId", departmentId);
      const res = await fetch(`/api/employees?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = (await res.json()) as EmployeesResponse;
      setEmployees(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch { toast.error("Failed to load employees"); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, status, departmentId]);

  useEffect(() => { void fetchEmployees(); }, [fetchEmployees]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success(`${name} deleted`);
      void fetchEmployees();
    } catch { toast.error("Failed to delete employee"); }
  }

  async function handleStartOnboarding(id: string) {
    try {
      const res = await fetch(`/api/employees/${id}/onboard`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Onboarding started");
      void fetchEmployees();
    } catch { toast.error("Failed to start onboarding"); }
  }

  async function handleStartOffboarding(id: string) {
    try {
      const res = await fetch(`/api/employees/${id}/offboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endDate: new Date().toISOString().split("T")[0] }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Offboarding started");
      void fetchEmployees();
    } catch { toast.error("Failed to start offboarding"); }
  }

  const TH: React.CSSProperties = {
    textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 600,
    color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="Employees" />
      <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 10, maxWidth: 640 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
              <input placeholder="Search employees..." style={{ ...INP, paddingLeft: 32, width: "100%" }} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select style={{ ...SEL, width: 160 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="all">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ONBOARDING">Onboarding</option>
              <option value="ACTIVE">Active</option>
              <option value="OFFBOARDING">Offboarding</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <select style={{ ...SEL, width: 176 }} value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}>
              <option value="all">All departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => setAddOpen(true)}>Add Employee</Button>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: 8, overflow: "hidden", boxShadow: "var(--shadow)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}>
                  <th style={TH}>Employee</th>
                  <th style={TH}>Department</th>
                  <th style={TH}>Position</th>
                  <th style={TH}>Manager</th>
                  <th style={TH}>Status</th>
                  <th style={TH}>Start Date</th>
                  <th style={{ ...TH, width: 48 }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "10px 16px" }} colSpan={7}><Skeleton style={{ height: 36, width: "100%" }} /></td>
                    </tr>
                  ))
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "64px 16px", textAlign: "center" }}>
                      <Users size={36} style={{ color: "var(--text-disabled)", margin: "0 auto 12px", display: "block" }} />
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>No employees found</p>
                      <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                        {search || status !== "all" || departmentId !== "all" ? "Try adjusting your filters" : "Add your first employee to get started"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  employees.map((emp, idx) => (
                    <tr
                      key={emp.id}
                      style={{ borderBottom: idx < employees.length - 1 ? "1px solid var(--border-subtle)" : "none", cursor: "pointer" }}
                      onClick={() => router.push(`/employees/${emp.id}`)}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <td style={{ padding: "10px 16px" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => router.push(`/employees/${emp.id}`)}>
                          <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--text-primary)", flexShrink: 0 }}>
                            {getInitials(`${emp.firstName} ${emp.lastName}`)}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>{emp.firstName} {emp.lastName}</p>
                            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--text-primary)" }}>{emp.department.name}</td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--text-primary)" }}>{emp.position}</td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--text-secondary)" }}>{emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : "—"}</td>
                      <td style={{ padding: "10px 16px" }}><EmployeeStatusPill status={emp.status} /></td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--text-secondary)", fontFamily: "'JetBrains Mono', monospace" }}>{formatDate(emp.startDate)}</td>
                      <td style={{ padding: "10px 16px" }} onClick={(e) => e.stopPropagation()}>
                        <RowMenu emp={emp} onEdit={() => setEditEmployee(emp)} onDelete={() => handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`)} onStartOnboarding={() => handleStartOnboarding(emp.id)} onStartOffboarding={() => handleStartOffboarding(emp.id)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} employees</p>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((n) => (
                <Button key={n} variant={n === page ? "primary" : "ghost"} size="sm" style={{ minWidth: 32 }} onClick={() => setPage(n)}>{n}</Button>
              ))}
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <AddEmployeeDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={fetchEmployees} />
      {editEmployee && (
        <EditEmployeeDialog
          open={!!editEmployee}
          onOpenChange={(open) => { if (!open) setEditEmployee(null); }}
          employee={editEmployee}
          onSuccess={() => { setEditEmployee(null); void fetchEmployees(); }}
        />
      )}
    </div>
  );
}
