"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, ChevronDown, ChevronUp, CheckCircle2, Circle, Clock, XCircle, SkipForward } from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/layout/topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { TaskStatusPill, type TaskStatus } from "@/components/ui/employee-status";
import { getInitials, formatDate } from "@/lib/utils";

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
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  position: string;
  avatarUrl?: string | null;
  startDate: string;
  department: { name: string };
  _count: { onboardingTasks: number; offboardingTasks: number };
  onboardingTasks?: Task[];
}

interface EmployeesResponse {
  data: Employee[];
}

function TaskStatusIcon({ status }: { status: TaskStatus }) {
  const style: React.CSSProperties = { flexShrink: 0 };
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 size={14} style={{ ...style, color: "var(--accent)" }} />;
    case "FAILED":
      return <XCircle size={14} style={{ ...style, color: "var(--err)" }} />;
    case "IN_PROGRESS":
      return <Clock size={14} style={{ ...style, color: "var(--info)" }} />;
    case "SKIPPED":
      return <SkipForward size={14} style={{ ...style, color: "var(--text-tertiary)" }} />;
    default:
      return <Circle size={14} style={{ ...style, color: "var(--text-tertiary)" }} />;
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [tasksMap, setTasksMap] = useState<Record<string, Task[]>>({});
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());
  const [markingTask, setMarkingTask] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState<string>("");

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/employees?status=ONBOARDING&pageSize=50");
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as EmployeesResponse;
        setEmployees(data.data);
      } catch {
        toast.error("Failed to load onboarding employees");
      } finally {
        setLoading(false);
      }
    }
    void fetch_();
  }, []);

  const loadTasks = useCallback(async (empId: string) => {
    if (tasksMap[empId]) return;
    setLoadingTasks((prev) => new Set(prev).add(empId));
    try {
      const res = await fetch(`/api/employees/${empId}`);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as Employee & { onboardingTasks: Task[] };
      setTasksMap((prev) => ({ ...prev, [empId]: data.onboardingTasks }));
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoadingTasks((prev) => {
        const next = new Set(prev);
        next.delete(empId);
        return next;
      });
    }
  }, [tasksMap]);

  const toggleExpand = useCallback((empId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) {
        next.delete(empId);
      } else {
        next.add(empId);
        void loadTasks(empId);
      }
      return next;
    });
  }, [loadTasks]);

  const markComplete = useCallback(async (empId: string, taskId: string) => {
    const key = `${empId}:${taskId}`;
    setMarkingTask(key);
    try {
      const res = await fetch(`/api/employees/${empId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED", type: "onboarding" }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed");
      }
      const updated = (await res.json()) as Task;
      setTasksMap((prev) => ({
        ...prev,
        [empId]: (prev[empId] ?? []).map((t) => (t.id === taskId ? { ...t, ...updated } : t)),
      }));
      toast.success("Task marked as complete");

      // Re-fetch employee list to update counts
      const listRes = await fetch("/api/employees?status=ONBOARDING&pageSize=50");
      if (listRes.ok) {
        const data = (await listRes.json()) as EmployeesResponse;
        setEmployees(data.data);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update task");
    } finally {
      setMarkingTask(null);
    }
  }, []);

  const departments = Array.from(new Set(employees.map((e) => e.department.name))).sort();
  const filtered = deptFilter ? employees.filter((e) => e.department.name === deptFilter) : employees;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Topbar title="Onboarding" subtitle="Manage onboarding tasks for new employees" />
      <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Currently Onboarding
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4, marginBottom: 0 }}>
              Employees actively going through the onboarding process
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {departments.length > 1 && (
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                style={{
                  height: 32,
                  padding: "0 10px",
                  fontSize: 12,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 6,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
            {!loading && (
              <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
                {filtered.length} employee{filtered.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} style={{ height: 180 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12 }}>
            <UserPlus size={40} style={{ color: "var(--text-disabled)" }} />
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
              {deptFilter ? `No employees onboarding in ${deptFilter}` : "No employees currently onboarding"}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              Start onboarding for a pending employee from the Employees page
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((emp) => {
              const fullName = `${emp.firstName} ${emp.lastName}`;
              const isExpanded = expandedIds.has(emp.id);
              const tasks = tasksMap[emp.id] ?? [];
              const isLoadingTasks = loadingTasks.has(emp.id);
              const totalTasks = emp._count.onboardingTasks;
              const completedTasks = tasks.filter((t) => t.status === "COMPLETED" || t.status === "SKIPPED").length;
              const displayProgress = isExpanded && tasks.length > 0
                ? Math.round((completedTasks / tasks.length) * 100)
                : 0;

              return (
                <div
                  key={emp.id}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 8,
                    boxShadow: "var(--shadow)",
                    overflow: "hidden",
                  }}
                >
                  {/* Card header */}
                  <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border-default)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          flexShrink: 0,
                          cursor: "pointer",
                        }}
                        onClick={() => router.push(`/employees/${emp.id}`)}
                      >
                        {getInitials(fullName)}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0, cursor: "pointer" }}
                          onClick={() => router.push(`/employees/${emp.id}`)}
                        >
                          {fullName}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "2px 0 0" }}>
                          {emp.department.name} &middot; {emp.position}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "2px 0 0" }}>
                          Started: {formatDate(emp.startDate)}
                        </p>
                      </div>
                      {/* Actions */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggleExpand(emp.id)}
                        rightIcon={isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      >
                        Tasks ({totalTasks})
                      </Button>
                    </div>

                    {/* Progress bar - show when expanded and tasks loaded */}
                    {isExpanded && tasks.length > 0 && (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Progress</span>
                          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                            {completedTasks}/{tasks.length} tasks done
                          </span>
                        </div>
                        <ProgressBar value={displayProgress} label="" />
                      </div>
                    )}
                  </div>

                  {/* Expanded task list */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      {isLoadingTasks ? (
                        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} style={{ height: 36 }} />
                          ))}
                        </div>
                      ) : tasks.length === 0 ? (
                        <p style={{ padding: 16, fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>
                          No tasks assigned
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          {tasks.map((task, idx) => {
                            const isCompleted = task.status === "COMPLETED" || task.status === "SKIPPED";
                            const isMarking = markingTask === `${emp.id}:${task.id}`;
                            return (
                              <div
                                key={task.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "10px 20px",
                                  borderBottom: idx < tasks.length - 1 ? "1px solid var(--border-subtle)" : undefined,
                                  background: isCompleted ? "rgba(16,185,129,0.02)" : undefined,
                                }}
                              >
                                <TaskStatusIcon status={task.status} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: isCompleted ? "var(--text-tertiary)" : "var(--text-primary)",
                                    margin: 0,
                                    textDecoration: isCompleted ? "line-through" : undefined,
                                  }}>
                                    {TASK_NAMES[task.type] ?? task.type}
                                  </p>
                                  {task.description && (
                                    <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "2px 0 0" }}>
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                                <TaskStatusPill status={task.status} />
                                {!isCompleted && (
                                  <Button
                                    variant="secondary"
                                    size="xs"
                                    loading={isMarking}
                                    onClick={() => void markComplete(emp.id, task.id)}
                                  >
                                    Mark Complete
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
