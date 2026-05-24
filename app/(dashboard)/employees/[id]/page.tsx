"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  SkipForward,
} from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import {
  EmployeeStatusPill,
  TaskStatusPill,
  type EmployeeStatus,
  type TaskStatus,
} from "@/components/ui/employee-status";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials, formatDate } from "@/lib/utils";
import { EditEmployeeDialog } from "@/components/employees/edit-employee-dialog";

const TASK_NAMES: Record<string, string> = {
  CREATE_LDAP_ACCOUNT: "Create LDAP Account",
  SEND_WELCOME_EMAIL: "Send Welcome Email",
  SETUP_EMAIL_ACCOUNT: "Setup Email Account",
  ASSIGN_EQUIPMENT: "Assign Equipment",
  GRANT_SYSTEM_ACCESS: "Grant System Access",
  COMPLETE_PAPERWORK: "Complete Paperwork",
  MANAGER_INTRODUCTION: "Manager Introduction",
  IT_ORIENTATION: "IT Orientation",
  REVOKE_LDAP_ACCOUNT: "Revoke LDAP Account",
  REVOKE_SYSTEM_ACCESS: "Revoke System Access",
  COLLECT_EQUIPMENT: "Collect Equipment",
  EXIT_INTERVIEW: "Exit Interview",
  KNOWLEDGE_TRANSFER: "Knowledge Transfer",
  FINAL_PAYROLL: "Final Payroll",
};

interface Task {
  id: string;
  type: string;
  status: TaskStatus;
  description?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  changes?: Record<string, unknown> | null;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
}

interface EmployeeDetail {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  position: string;
  status: EmployeeStatus;
  startDate: string;
  endDate?: string | null;
  avatarUrl?: string | null;
  notes?: string | null;
  departmentId: string;
  managerId?: string | null;
  department: { id: string; name: string; code: string };
  manager?: { id: string; firstName: string; lastName: string; position: string } | null;
  onboardingTasks: Task[];
  offboardingTasks: Task[];
  auditLogs: AuditLog[];
}

function TaskStatusIcon({ status }: { status: TaskStatus }) {
  const props = { size: 15, style: { flexShrink: 0 } as React.CSSProperties };
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 {...props} style={{ ...props.style, color: "var(--accent)" }} />;
    case "FAILED":
      return <XCircle {...props} style={{ ...props.style, color: "var(--err)" }} />;
    case "IN_PROGRESS":
      return <Clock {...props} style={{ ...props.style, color: "var(--info)" }} />;
    case "SKIPPED":
      return <SkipForward {...props} style={{ ...props.style, color: "var(--text-tertiary)" }} />;
    default:
      return <Circle {...props} style={{ ...props.style, color: "var(--text-tertiary)" }} />;
  }
}

function taskProgress(tasks: Task[]): number {
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => t.status === "COMPLETED" || t.status === "SKIPPED").length;
  return Math.round((done / tasks.length) * 100);
}

function TaskList({
  tasks,
  employeeId,
  type,
  onRefresh,
}: {
  tasks: Task[];
  employeeId: string;
  type: "onboarding" | "offboarding";
  onRefresh: () => void;
}) {
  const [marking, setMarking] = useState<string | null>(null);

  async function markComplete(taskId: string) {
    setMarking(taskId);
    try {
      const res = await fetch(`/api/employees/${employeeId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED", type }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Task marked as complete");
      onRefresh();
    } catch {
      toast.error("Failed to update task");
    } finally {
      setMarking(null);
    }
  }

  if (!tasks.length) {
    return (
      <p style={{ fontSize: 13, color: "var(--text-tertiary)", textAlign: "center", padding: "16px 0" }}>
        No {type} tasks found
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>Overall Progress</span>
        </div>
        <ProgressBar value={taskProgress(tasks)} label="show" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 7,
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-elevated)",
            }}
          >
            <TaskStatusIcon status={task.status} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>
                {TASK_NAMES[task.type] ?? task.type}
              </p>
              {task.completedAt && (
                <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "2px 0 0" }}>
                  Completed {format(new Date(task.completedAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
              {task.description && (
                <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "2px 0 0" }}>{task.description}</p>
              )}
            </div>
            <TaskStatusPill status={task.status} />
            {task.status !== "COMPLETED" && task.status !== "SKIPPED" && (
              <Button
                size="sm"
                variant="secondary"
                loading={marking === task.id}
                disabled={marking === task.id}
                onClick={() => markComplete(task.id)}
              >
                Mark Complete
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type TabValue = "onboarding" | "offboarding" | "audit";

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("onboarding");

  async function fetchEmployee() {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${id}`);
      if (!res.ok) {
        if (res.status === 404) { router.push("/employees"); return; }
        throw new Error("Failed");
      }
      const data = (await res.json()) as EmployeeDetail;
      setEmployee(data);
    } catch {
      toast.error("Failed to load employee");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchEmployee();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAction(action: "onboard" | "offboard" | "complete-offboarding") {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/employees/${id}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const messages: Record<string, string> = {
        onboard: "Onboarding started",
        offboard: "Offboarding started",
        "complete-offboarding": "Offboarding completed",
      };
      toast.success(messages[action]);
      void fetchEmployee();
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Topbar title="Employee Detail" />
        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <Skeleton style={{ height: 32, width: 200 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
            <Skeleton style={{ height: 320 }} />
            <Skeleton style={{ height: 320 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!employee) return null;

  const fullName = `${employee.firstName} ${employee.lastName}`;

  const TABS: { value: TabValue; label: string; count: number }[] = [
    { value: "onboarding", label: "Onboarding Tasks", count: employee.onboardingTasks.length },
    { value: "offboarding", label: "Offboarding Tasks", count: employee.offboardingTasks.length },
    { value: "audit", label: "Audit Log", count: employee.auditLogs.length },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="Employee Detail" />
      <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Back + Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft size={13} />}
              style={{ color: "var(--text-tertiary)" }}
              onClick={() => router.push("/employees")}
            >
              Back
            </Button>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{fullName}</h2>
            <EmployeeStatusPill status={employee.status} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>Edit</Button>
            {employee.status === "PENDING" && (
              <Button variant="primary" size="sm" loading={actionLoading} onClick={() => handleAction("onboard")}>
                Start Onboarding
              </Button>
            )}
            {employee.status === "ACTIVE" && (
              <Button variant="secondary" size="sm" loading={actionLoading} onClick={() => handleAction("offboard")}>
                Start Offboarding
              </Button>
            )}
            {employee.status === "OFFBOARDING" && (
              <Button variant="destructive" size="sm" loading={actionLoading} onClick={() => handleAction("complete-offboarding")}>
                Complete Offboarding
              </Button>
            )}
          </div>
        </div>

        {/* Content grid */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, alignItems: "start" }}>
          {/* Left: Employee Info */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: 8,
              padding: 20,
              boxShadow: "var(--shadow)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {getInitials(fullName)}
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{fullName}</h3>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "3px 0 6px" }}>{employee.position}</p>
                <EmployeeStatusPill status={employee.status} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <InfoRow label="Employee ID" value={employee.employeeId} mono />
              <InfoRow label="Email" value={employee.email} />
              <InfoRow label="Phone" value={employee.phone ?? "—"} />
              <InfoRow label="Department" value={employee.department.name} />
              <InfoRow
                label="Manager"
                value={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "—"}
              />
              <InfoRow label="Start Date" value={formatDate(employee.startDate)} />
              {employee.endDate && <InfoRow label="End Date" value={formatDate(employee.endDate)} />}
              {employee.notes && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                    Notes
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-primary)", margin: 0 }}>{employee.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Tabs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Tab headers */}
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid var(--border-subtle)",
                gap: 0,
              }}
            >
              {TABS.map((tab) => {
                const active = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    style={{
                      padding: "10px 16px",
                      fontSize: 13,
                      fontWeight: active ? 500 : 400,
                      color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                      background: "transparent",
                      border: "none",
                      borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                      cursor: "pointer",
                      marginBottom: -1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tab.label}
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: active ? "var(--text-secondary)" : "var(--text-disabled)",
                      }}
                    >
                      ({tab.count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderTop: "none",
                borderRadius: "0 0 8px 8px",
                padding: 20,
                boxShadow: "var(--shadow)",
              }}
            >
              {activeTab === "onboarding" && (
                <TaskList
                  tasks={employee.onboardingTasks}
                  employeeId={employee.id}
                  type="onboarding"
                  onRefresh={fetchEmployee}
                />
              )}
              {activeTab === "offboarding" && (
                <TaskList
                  tasks={employee.offboardingTasks}
                  employeeId={employee.id}
                  type="offboarding"
                  onRefresh={fetchEmployee}
                />
              )}
              {activeTab === "audit" && (
                employee.auditLogs.length === 0 ? (
                  <p style={{ fontSize: 13, color: "var(--text-tertiary)", textAlign: "center", padding: "16px 0" }}>
                    No audit log entries
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {employee.auditLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          display: "flex",
                          gap: 12,
                          padding: "10px 14px",
                          borderRadius: 7,
                          border: "1px solid var(--border-subtle)",
                          background: "var(--bg-elevated)",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{log.action}</span>
                            <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>on {log.entity}</span>
                          </div>
                          {log.user && (
                            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "2px 0 0" }}>
                              by {log.user.name}
                            </p>
                          )}
                        </div>
                        <time style={{ fontSize: 11, color: "var(--text-tertiary)", flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                          {format(new Date(log.createdAt), "MMM d, h:mm a")}
                        </time>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <EditEmployeeDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          employee={employee}
          onSuccess={() => { setEditOpen(false); void fetchEmployee(); }}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
        {label}
      </p>
      <p style={{ fontSize: 12, color: "var(--text-primary)", margin: 0, fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit" }}>
        {value}
      </p>
    </div>
  );
}
