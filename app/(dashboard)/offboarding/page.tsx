"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserMinus } from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/layout/topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials, formatDate } from "@/lib/utils";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  position: string;
  avatarUrl?: string | null;
  startDate: string;
  endDate?: string | null;
  department: { name: string };
  _count: { onboardingTasks: number; offboardingTasks: number };
}

interface EmployeesResponse {
  data: Employee[];
}

export default function OffboardingPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/employees?status=OFFBOARDING&pageSize=100");
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as EmployeesResponse;
        setEmployees(data.data);
      } catch {
        toast.error("Failed to load offboarding employees");
      } finally {
        setLoading(false);
      }
    }
    void fetch_();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="Offboarding" />
      <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Currently Offboarding
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4, marginBottom: 0 }}>
              Employees actively going through the offboarding process
            </p>
          </div>
          {!loading && (
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
              {employees.length} employee{employees.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} style={{ height: 160 }} />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12 }}>
            <UserMinus size={40} style={{ color: "var(--text-disabled)" }} />
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
              No employees currently offboarding
            </p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              Start offboarding for an active employee from the Employees page
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {employees.map((emp) => {
              const totalTasks = emp._count.offboardingTasks;
              const fullName = `${emp.firstName} ${emp.lastName}`;
              return (
                <div
                  key={emp.id}
                  className="card-hover"
                  onClick={() => router.push(`/employees/${emp.id}`)}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 8,
                    padding: 20,
                    cursor: "pointer",
                    boxShadow: "var(--shadow)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-default)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(fullName)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {fullName}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {emp.department.name} &middot; {emp.position}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Tasks assigned</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{totalTasks}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>
                      View employee for detailed progress
                    </p>
                  </div>

                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                    <p style={{ margin: 0 }}>Started: {formatDate(emp.startDate)}</p>
                    {emp.endDate && <p style={{ margin: "2px 0 0" }}>End date: {formatDate(emp.endDate)}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
