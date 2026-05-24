type EmployeeStatus = "PENDING" | "ONBOARDING" | "ACTIVE" | "OFFBOARDING" | "INACTIVE";
type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "SKIPPED";

interface PillStyle {
  bg: string;
  border: string;
  text: string;
  label: string;
}

const EMPLOYEE_STATUS_STYLES: Record<EmployeeStatus, PillStyle> = {
  PENDING:     { bg: "rgba(138,138,132,0.08)", border: "rgba(138,138,132,0.22)", text: "var(--text-tertiary)", label: "Pending" },
  ONBOARDING:  { bg: "rgba(2,132,199,0.08)",   border: "rgba(2,132,199,0.22)",   text: "var(--info)",          label: "Onboarding" },
  ACTIVE:      { bg: "rgba(16,185,129,0.08)",   border: "rgba(16,185,129,0.22)",  text: "var(--accent)",        label: "Active" },
  OFFBOARDING: { bg: "rgba(217,119,6,0.08)",    border: "rgba(217,119,6,0.22)",   text: "var(--warn)",          label: "Offboarding" },
  INACTIVE:    { bg: "rgba(138,138,132,0.08)",  border: "rgba(138,138,132,0.22)", text: "var(--text-tertiary)", label: "Inactive" },
};

const TASK_STATUS_STYLES: Record<TaskStatus, PillStyle> = {
  PENDING:     { bg: "rgba(138,138,132,0.08)", border: "rgba(138,138,132,0.22)", text: "var(--text-tertiary)", label: "Pending" },
  IN_PROGRESS: { bg: "rgba(2,132,199,0.08)",   border: "rgba(2,132,199,0.22)",   text: "var(--info)",          label: "In Progress" },
  COMPLETED:   { bg: "rgba(16,185,129,0.08)",   border: "rgba(16,185,129,0.22)",  text: "var(--accent)",        label: "Completed" },
  FAILED:      { bg: "rgba(220,38,38,0.08)",    border: "rgba(220,38,38,0.22)",   text: "var(--err)",           label: "Failed" },
  SKIPPED:     { bg: "rgba(138,138,132,0.08)",  border: "rgba(138,138,132,0.22)", text: "var(--text-tertiary)", label: "Skipped" },
};

const PILL_BASE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 8px",
  borderRadius: 3,
  fontSize: 11,
  fontWeight: 500,
  borderWidth: 1,
  borderStyle: "solid",
};

export function EmployeeStatusPill({ status }: { status: EmployeeStatus }) {
  const s = EMPLOYEE_STATUS_STYLES[status];
  return (
    <span style={{ ...PILL_BASE, background: s.bg, borderColor: s.border, color: s.text }}>
      {s.label}
    </span>
  );
}

export function TaskStatusPill({ status }: { status: TaskStatus }) {
  const s = TASK_STATUS_STYLES[status];
  return (
    <span style={{ ...PILL_BASE, background: s.bg, borderColor: s.border, color: s.text }}>
      {s.label}
    </span>
  );
}

export type { EmployeeStatus, TaskStatus };
