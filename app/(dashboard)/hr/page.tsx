"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  Building2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import Topbar from "@/components/layout/topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeStatusPill, type EmployeeStatus } from "@/components/ui/employee-status";
import { formatDate } from "@/lib/utils";

interface RecentEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  position: string;
  status: EmployeeStatus;
  startDate: string;
  department: { name: string };
}

interface TaskStat {
  status: string;
  _count: number;
}

interface HRStats {
  totalEmployees: number;
  activeEmployees: number;
  onboardingEmployees: number;
  offboardingEmployees: number;
  pendingEmployees: number;
  totalDepartments: number;
  recentEmployees: RecentEmployee[];
  onboardingProgress: TaskStat[];
}

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const duration = 900;
    const startTime = performance.now();
    function update(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      if (ref.current) ref.current.textContent = Math.round(eased * value).toLocaleString();
      if (t < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }, [value]);
  return <span ref={ref}>0</span>;
}

const STAT_CARDS = [
  { key: "totalEmployees" as const,    label: "Total Employees", Icon: Users,      color: "var(--info)" },
  { key: "activeEmployees" as const,   label: "Active",          Icon: UserCheck,  color: "var(--accent)" },
  { key: "onboardingEmployees" as const, label: "Onboarding",    Icon: UserPlus,   color: "var(--info)" },
  { key: "offboardingEmployees" as const, label: "Offboarding",  Icon: UserMinus,  color: "var(--warn)" },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  FAILED: "Failed",
  SKIPPED: "Skipped",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#8A8A84",
  IN_PROGRESS: "#0284C7",
  COMPLETED: "#059669",
  FAILED: "#DC2626",
  SKIPPED: "#C4C4BC",
};

const TH: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 20px",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

export default function HROverviewPage() {
  const [data, setData] = useState<HRStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employees/stats")
      .then((r) => r.json())
      .then((d: HRStats) => setData(d))
      .catch(() => toast.error("Failed to load HR data"))
      .finally(() => setLoading(false));
  }, []);

  const chartData = (data?.onboardingProgress ?? []).map((s) => ({
    name: STATUS_LABELS[s.status] ?? s.status,
    count: s._count,
    fill: STATUS_COLORS[s.status] ?? "#8A8A84",
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="HR Overview" />

      <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            HR Overview
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4, marginBottom: 0 }}>
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {STAT_CARDS.map(({ key, label, Icon, color }) => (
            <div
              key={key}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: 8,
                padding: 20,
                boxShadow: "var(--shadow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>{label}</p>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>
                  {loading ? (
                    <Skeleton style={{ height: 32, width: 56 }} />
                  ) : (
                    <AnimatedNumber value={data?.[key] ?? 0} />
                  )}
                </div>
              </div>
              <div
                style={{
                  width: 40, height: 40, borderRadius: 9,
                  background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                <Icon size={18} style={{ color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Departments */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
          <div
            style={{
              background: "var(--bg-surface)", border: "1px solid var(--border-default)",
              borderRadius: 8, padding: 20, boxShadow: "var(--shadow)",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16, marginTop: 0 }}>
              Onboarding Task Status
            </p>
            {loading ? (
              <Skeleton style={{ height: 220, width: "100%" }} />
            ) : chartData.length === 0 ? (
              <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>No tasks yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" tick={{ fill: "var(--text-tertiary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-tertiary)", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-surface)", border: "1px solid var(--border-default)",
                      borderRadius: 8, color: "var(--text-primary)", fontSize: 13,
                    }}
                    cursor={{ fill: "var(--bg-elevated)" }}
                  />
                  <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div
            style={{
              background: "var(--bg-surface)", border: "1px solid var(--border-default)",
              borderRadius: 8, padding: 20, boxShadow: "var(--shadow)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Building2 size={14} style={{ color: "var(--text-tertiary)" }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Departments</p>
            </div>
            {loading ? (
              <Skeleton style={{ height: 60, width: "100%" }} />
            ) : (
              <>
                <p style={{ fontSize: 36, fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                  {data?.totalDepartments ?? 0}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>departments total</p>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
                  <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>Pending employees</p>
                  <p style={{ fontSize: 20, fontWeight: 600, color: "var(--warn)", margin: "4px 0 0" }}>
                    {loading ? "—" : (data?.pendingEmployees ?? 0)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Employees */}
        <div
          style={{
            background: "var(--bg-surface)", border: "1px solid var(--border-default)",
            borderRadius: 8, overflow: "hidden", boxShadow: "var(--shadow)",
          }}
        >
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Recent Employees
            </p>
          </div>
          {loading ? (
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} style={{ height: 36, width: "100%" }} />
              ))}
            </div>
          ) : !data?.recentEmployees.length ? (
            <div style={{ padding: 24, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>No employees yet</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <th style={TH}>Employee</th>
                    <th style={TH}>Department</th>
                    <th style={TH}>Status</th>
                    <th style={TH}>Start Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentEmployees.map((emp, idx) => (
                    <tr
                      key={emp.id}
                      style={{ borderBottom: idx < data.recentEmployees.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <td style={{ padding: "12px 20px" }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                          {emp.employeeId} · {emp.position}
                        </p>
                      </td>
                      <td style={{ padding: "12px 20px", fontSize: 13, color: "var(--text-primary)" }}>
                        {emp.department.name}
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <EmployeeStatusPill status={emp.status} />
                      </td>
                      <td style={{ padding: "12px 20px", fontSize: 13, color: "var(--text-secondary)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {formatDate(emp.startDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
