"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserMinus, ChevronDown, ChevronUp, CheckCircle2, Circle, Clock, XCircle, SkipForward, AlertTriangle } from "lucide-react";
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
  endDate?: string | null;
  department: { name: string };
  _count: { onboardingTasks: number; offboardingTasks: number };
  offboardingTasks?: Task[];
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

export default function OffboardingPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [tasksMap, setTasksMap] = useState<Record<string, Task[]>>({});
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());
  const [markingTask, setMarkingTask] = useState<string | null>(null);
  const [completingOffboard, setCompletingOffboard] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState<string>("");

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees?status=OFFBOARDING&pageSize=50");
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as EmployeesResponse;
      setEmployees(data.data);
    } catch {
      toast.error("Failed to load offboarding employees");
    }
  }, []);

  useEffect(() => {
    void fetchEmployees().finally(() => setLoading(false));
  }, [fetchEmployees]);

  const loadTasks = useCallback(async (empId: string) => {
    if (tasksMap[empId]) return;
    setLoadingTasks((prev) => new Set(prev).add(empId));
    try {
      const res = await fetch(`/api/employees/${empId}`);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as Employee & { offboardingTasks: Task[] };
      setTasksMap((prev) => ({ ...prev, [empId]: data.offboardingTasks }));
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
        body: JSON.stringify({ status: "COMPLETED", type: "offboarding" }),
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
      await fetchEmployees();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update task");
    } finally {
      setMarkingTask(null);
    }
  }, [fetchEmployees]);

  const completeOffboarding = useCallback(async (empId: string) => {
    setCompletingOffboard(empId);
    try {
      const res = await fetch(`/api/employees/${empId}/complete-offboarding`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed");
      }
      toast.success("Offboarding completed — employee is now inactive");
      await fetchEmployees();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to complete offboarding");
    } finally {
      setCompletingOffboard(null);
    }
  }, [fetchEmployees]);

  const departments = Array.from(new Set(employees.map((e) => e.department.name))).sort();
  const filtered = deptFilter ? employees.filter((e) => e.department.name === deptFilter) : employees;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Topbar title="Offboarding" subtitle="Manage offboarding tasks for departing employees" />
      <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
        {/* Warning banner */}
        {!loading && filtered.length > 0 && (
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "10px 14px",
            background: "rgba(217,119,6,0.06)",
            border: "1px solid rgba(217,119,6,0.22)",
            borderRadius: 6,
          }}>
            <AlertTriangle size={15} style={{ color: "var(--warn)", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "var(--warn)", margin: 0 }}>
              <strong>{filtered.length} employee{filtered.length !== 1 ? "s" : ""}</strong> currently offboarding.
              Complete all tasks before finalizing offboarding.
            </p>
          </div>
        )}

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Currently Offboarding
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4, marginBottom: 0 }}>
              Employees actively going through the offboarding process
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
            <UserMinus size={40} style={{ color: "var(--text-disabled)" }} />
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
              {deptFilter ? `No employees offboarding in ${deptFilter}` : "No employees currently offboarding"}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              Start offboarding for an active employee from the Employees page
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((emp) => {
              const fullName = `${emp.firstName} ${emp.lastName}`;
              const isExpanded = expandedIds.has(emp.id);
              const tasks = tasksMap[emp.id] ?? [];
              const isLoadingTasks = loadingTasks.has(emp.id);
              const totalTasks = emp._count.offboardingTasks;
              const completedTasks = tasks.filter((t) => t.status === "COMPLETED" || t.status === "SKIPPED").length;
              const allDone = tasks.length > 0 && completedTasks === tasks.length;
              const displayProgress = isExpanded && tasks.length > 0
                ? Math.round((completedTasks / tasks.length) * 100)
                : 0;
              const isCompletingThis = completingOffboard === emp.id;

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
                          background: "rgba(217,119,6,0.08)",
                          border: "1px solid rgba(217,119,6,0.22)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--warn)",
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
                        <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
                          <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>
                            Started: {formatDate(emp.startDate)}
                          </p>
                          {emp.endDate && (
                            <p style={{ fontSize: 11, color: "var(--warn)", margin: 0, fontWeight: 500 }}>
                              Ends: {formatDate(emp.endDate)}
                            </p>
                          )}
                        </div>
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

                    {/* Complete Offboarding button when all tasks done */}
                    {isExpanded && allDone && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "rgba(16,185,129,0.06)",
                        border: "1px solid rgba(16,185,129,0.22)",
                        borderRadius: 6,
                      }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 500, color: "var(--accent)", margin: 0 }}>
                            All tasks completed
                          </p>
                          <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "2px 0 0" }}>
                            Ready to finalize offboarding
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          loading={isCompletingThis}
                          onClick={() => void completeOffboarding(emp.id)}
                        >
                          Complete Offboarding
                        </Button>
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
