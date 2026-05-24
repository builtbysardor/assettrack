"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import Topbar from "@/components/layout/topbar";

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 8,
        boxShadow: "var(--shadow)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AuditLog {
  id: string;
  entity: string;
  action: string;
  changes?: Record<string, unknown> | null;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  } | null;
}

interface AuditResponse {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const PAGE_SIZE = 25;
const ENTITY_OPTIONS = ["Employee", "Department", "OnboardingTask", "OffboardingTask", "User"];
const ACTION_OPTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "ONBOARD",
  "OFFBOARD",
  "COMPLETE_OFFBOARDING",
  "TASK_UPDATE",
];

// ─── Styles ────────────────────────────────────────────────────────────────────
const SELECT: React.CSSProperties = {
  height: 36,
  padding: "0 28px 0 10px",
  background: "var(--bg-inset)",
  border: "1px solid var(--border-default)",
  borderRadius: 7,
  fontSize: 13,
  color: "var(--text-primary)",
  outline: "none",
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238A8A84' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
  cursor: "pointer",
};

const BTN_GHOST: React.CSSProperties = {
  height: 32,
  padding: "0 10px",
  background: "none",
  color: "var(--text-secondary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 6,
  fontSize: 12,
  cursor: "pointer",
};

const BTN_ACTIVE: React.CSSProperties = {
  ...BTN_GHOST,
  background: "var(--bg-elevated)",
  color: "var(--text-primary)",
  borderColor: "var(--border-default)",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (entityFilter !== "all") params.set("entity", entityFilter);
      if (actionFilter !== "all") params.set("action", actionFilter);

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as AuditResponse;
      setLogs(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter, actionFilter]);

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Topbar title="Audit Log" />

      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
              style={{ ...SELECT, width: 170 }}
            >
              <option value="all">All entities</option>
              {ENTITY_OPTIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              style={{ ...SELECT, width: 180 }}
            >
              <option value="all">All actions</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>
            {loading ? "Loading…" : `${total.toLocaleString()} entries`}
          </p>
        </div>

        {/* Table */}
        <Card style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Timestamp", "Entity", "Action", "Employee", "Performed By", "Details"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "10px 12px",
                          fontSize: 10,
                          fontWeight: 500,
                          color: "var(--text-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          borderBottom: "1px solid var(--border-subtle)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      <td
                        colSpan={6}
                        style={{
                          padding: "10px 12px",
                          borderBottom: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div
                          style={{ height: 16, background: "var(--bg-elevated)", borderRadius: 4 }}
                        />
                      </td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "48px 12px",
                        textAlign: "center",
                        color: "var(--text-tertiary)",
                        fontSize: 13,
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      {entityFilter !== "all" || actionFilter !== "all"
                        ? "Try adjusting your filters"
                        : "No audit logs yet"}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-subtle)", verticalAlign: "top" }}>
                        <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-tertiary)", margin: 0, whiteSpace: "nowrap" }}>
                          {format(new Date(log.createdAt), "MMM d, yyyy")}
                        </p>
                        <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-tertiary)", opacity: 0.7, margin: 0, marginTop: 1, whiteSpace: "nowrap" }}>
                          {format(new Date(log.createdAt), "h:mm:ss a")}
                        </p>
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-subtle)", verticalAlign: "top" }}>
                        <span style={{ display: "inline-block", padding: "2px 7px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 4, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-secondary)" }}>
                          {log.entity}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-subtle)", verticalAlign: "top" }}>
                        <span style={{ display: "inline-block", padding: "2px 7px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 4, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-primary)", fontWeight: 500 }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-subtle)", verticalAlign: "top" }}>
                        {log.employee ? (
                          <div>
                            <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0 }}>
                              {log.employee.firstName} {log.employee.lastName}
                            </p>
                            <p style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "'JetBrains Mono', monospace", margin: 0, marginTop: 1 }}>
                              {log.employee.employeeId}
                            </p>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-tertiary)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-subtle)", verticalAlign: "top" }}>
                        {log.user ? (
                          <div>
                            <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0 }}>
                              {log.user.name}
                            </p>
                            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0, marginTop: 1 }}>
                              {log.user.email}
                            </p>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>System</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-subtle)", verticalAlign: "top", maxWidth: 200 }}>
                        {log.changes ? (
                          <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", background: "var(--bg-elevated)", padding: "2px 6px", borderRadius: 4, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                            {JSON.stringify(log.changes)}
                          </code>
                        ) : (
                          <span style={{ color: "var(--text-tertiary)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button style={page <= 1 ? { ...BTN_GHOST, opacity: 0.4, cursor: "not-allowed" } : BTN_GHOST} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((n) => (
                <button key={n} style={n === page ? BTN_ACTIVE : BTN_GHOST} onClick={() => setPage(n)}>
                  {n}
                </button>
              ))}
              {totalPages > 7 && page < totalPages - 3 && (
                <span style={{ color: "var(--text-tertiary)", fontSize: 12, padding: "0 4px" }}>…</span>
              )}
              <button style={page >= totalPages ? { ...BTN_GHOST, opacity: 0.4, cursor: "not-allowed" } : BTN_GHOST} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
