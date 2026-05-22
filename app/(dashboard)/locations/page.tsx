"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Location } from "@prisma/client";
import TopBar from "@/components/layout/topbar";

type LocationWithCount = Location & { _count: { assets: number } };

// ── Modal overlay ─────────────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(2px)",
        animation: "fadeIn 0.15s both",
      }}
    >
      <div style={{
        background: "var(--surf)",
        border: "1px solid var(--b1)",
        borderRadius: 8,
        boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        width: 480, maxWidth: "90vw",
        animation: "fadeSlideUp 0.2s both",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {children}
      </div>
    </div>
  );
}

const INP: React.CSSProperties = {
  width: "100%", height: 38, padding: "0 12px",
  background: "var(--inset)", border: "1px solid var(--b2)",
  borderRadius: 6, color: "var(--t1)", fontSize: 13, outline: "none",
};

const LBL: React.CSSProperties = {
  display: "block", fontSize: 11, color: "var(--t2)", marginBottom: 4,
  fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em",
};

// ── Location modal ────────────────────────────────────────────────────────────

function LocationModal({
  mode, initial, buildings, onSave, onClose, loading,
}: {
  mode: "add" | "edit";
  initial?: LocationWithCount;
  buildings: string[];
  onSave: (data: { building: string; room: string; floor: string; description: string }) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}) {
  const [building, setBuilding] = useState(initial?.building ?? "");
  const [room, setRoom] = useState(initial?.room ?? "");
  const [floor, setFloor] = useState(initial?.floor ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [err, setErr] = useState("");

  async function save() {
    if (!building.trim()) { setErr("Building name is required"); return; }
    if (!room.trim())     { setErr("Room name is required"); return; }
    if (!floor.trim())    { setErr("Floor is required"); return; }
    setErr("");
    await onSave({ building: building.trim(), room: room.trim(), floor: floor.trim(), description: description.trim() });
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 13 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", margin: 0 }}>
          {mode === "add" ? "New location" : "Edit location"}
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={LBL}>Building</label>
            <input
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              placeholder="e.g. HQ"
              list="buildings-list"
              style={INP}
              autoFocus
            />
            <datalist id="buildings-list">
              {buildings.map((b) => <option key={b} value={b} />)}
            </datalist>
          </div>
          <div>
            <label style={LBL}>Room</label>
            <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Floor 2" style={INP} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={LBL}>Floor</label>
            <input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="e.g. 2" style={INP} />
          </div>
          <div>
            <label style={LBL}>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" style={INP} />
          </div>
        </div>

        {err && <div style={{ fontSize: 12, color: "var(--err)" }}>{err}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
          <button onClick={onClose} style={{
            height: 30, padding: "0 11px", borderRadius: 5, border: "1px solid var(--b2)",
            background: "transparent", color: "var(--t1)", fontSize: 12, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={save} disabled={loading} style={{
            height: 30, padding: "0 11px", borderRadius: 5, border: "none",
            background: "var(--accent)", color: "white", fontSize: 12, fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
          }}>
            {loading ? "Saving…" : mode === "add" ? "Create" : "Save changes"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  title, body, confirmLabel, onConfirm, onClose, loading,
}: {
  title: string; body: string; confirmLabel: string;
  onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: 22 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", margin: "0 0 8px" }}>{title}</h3>
        <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.6, marginBottom: 20 }}>{body}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            height: 30, padding: "0 11px", borderRadius: 5, border: "1px solid var(--b2)",
            background: "transparent", color: "var(--t1)", fontSize: 12, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{
            height: 30, padding: "0 11px", borderRadius: 5, border: "none",
            background: "var(--err)", color: "white", fontSize: 12, fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
          }}>
            {loading ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Location row ──────────────────────────────────────────────────────────────

function LocationRow({
  loc, last, onEdit, onDelete,
}: {
  loc: LocationWithCount; last: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: hov ? "var(--elev)" : "transparent", transition: "background 0.1s" }}
    >
      <td style={{ padding: "10px 18px", borderBottom: last ? "none" : "1px solid var(--b1)", color: "var(--t1)", fontWeight: 500, fontSize: 13 }}>
        {loc.room}
      </td>
      <td style={{ padding: "10px 18px", borderBottom: last ? "none" : "1px solid var(--b1)", color: "var(--t2)", fontSize: 12 }}>
        {loc.floor}
      </td>
      <td style={{ padding: "10px 18px", borderBottom: last ? "none" : "1px solid var(--b1)", color: "var(--t3)", fontSize: 12, maxWidth: 200 }}>
        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {loc.description || "—"}
        </span>
      </td>
      <td style={{ padding: "10px 18px", borderBottom: last ? "none" : "1px solid var(--b1)" }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
          color: "var(--t1)", fontWeight: 600,
          background: "var(--inset)", border: "1px solid var(--b1)",
          borderRadius: 4, padding: "2px 8px",
        }}>{loc._count.assets}</span>
      </td>
      <td style={{ padding: "10px 18px", borderBottom: last ? "none" : "1px solid var(--b1)", textAlign: "right" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 3, opacity: hov ? 1 : 0, transition: "opacity 0.12s" }}>
          <button onClick={onEdit} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 26, height: 26, borderRadius: 4,
            background: "var(--elev)", border: "1px solid var(--b2)",
            cursor: "pointer", color: "var(--t2)",
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={onDelete} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 26, height: 26, borderRadius: 4,
            background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)",
            cursor: "pointer", color: "var(--err)",
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Add card ──────────────────────────────────────────────────────────────────

function AddCard({ onClick, label }: { onClick: () => void; label: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: `2px dashed ${hov ? "var(--b3)" : "var(--b2)"}`,
        borderRadius: 8, padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        cursor: "pointer", transition: "all 0.14s",
        background: hov ? "var(--elev)" : "transparent",
        color: hov ? "var(--t1)" : "var(--t3)",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; item: LocationWithCount } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleting, setDeleting] = useState<LocationWithCount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/locations", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setLocations(data.items);
    } catch {
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const buildings = Array.from(new Set(locations.map((l) => l.building)));
  const totalAssets = locations.reduce((s, l) => s + l._count.assets, 0);
  const existingBuildings = buildings;

  function toggleCollapse(b: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b); else next.add(b);
      return next;
    });
  }

  async function handleSave(data: { building: string; room: string; floor: string; description: string }) {
    setModalLoading(true);
    try {
      if (modal?.mode === "add") {
        const res = await fetch("/api/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.ok) {
          toast.success("Location created");
          setModal(null);
          fetchLocations();
        } else {
          toast.error(json.error ?? "Failed to create");
        }
      } else if (modal?.mode === "edit") {
        const res = await fetch(`/api/locations/${modal.item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.ok) {
          toast.success("Location updated");
          setModal(null);
          fetchLocations();
        } else {
          toast.error(json.error ?? "Failed to update");
        }
      }
    } catch {
      toast.error("Request failed");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/locations/${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        toast.success("Location deleted");
        setDeleting(null);
        fetchLocations();
      } else {
        const count = data.assetCount as number | undefined;
        if (count && count > 0) {
          toast.error(`Cannot delete — ${count} asset${count !== 1 ? "s" : ""} are assigned here. Reassign first.`);
        } else {
          toast.error(data.error ?? "Failed to delete");
        }
        setDeleting(null);
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)", overflow: "hidden" }}>
      <TopBar
        title="Locations"
        subtitle={`${locations.length} rooms across ${buildings.length} buildings`}
        actions={
          <button
            onClick={() => setModal({ mode: "add" })}
            style={{
              height: 30, padding: "0 11px", borderRadius: 5, border: "none",
              background: "var(--accent)", color: "white", fontSize: 12, fontWeight: 500,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New location
          </button>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Buildings",    value: buildings.length },
            { label: "Total rooms",  value: locations.length },
            { label: "Total assets", value: totalAssets },
          ].map((s) => (
            <div key={s.label} style={{
              padding: "14px 18px",
              background: "var(--surf)", border: "1px solid var(--b1)",
              borderRadius: 8, boxShadow: "var(--shadow)",
            }}>
              <div style={{ fontSize: 11, color: "var(--t3)", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, color: "var(--t1)", fontWeight: 700 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ height: 160, borderRadius: 8, background: "var(--elev)", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {buildings.map((building) => {
              const rooms = locations.filter((l) => l.building === building);
              const isOpen = !collapsed.has(building);
              return (
                <div key={building} style={{
                  background: "var(--surf)", border: "1px solid var(--b1)",
                  borderRadius: 8, overflow: "hidden",
                }}>
                  {/* Building header */}
                  <button
                    onClick={() => toggleCollapse(building)}
                    style={{
                      width: "100%", padding: "13px 18px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "none", border: "none", cursor: "pointer",
                      borderBottom: isOpen ? "1px solid var(--b1)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 7,
                        background: "var(--elev)", border: "1px solid var(--b2)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", textAlign: "left" }}>{building}</div>
                        <div style={{ fontSize: 11, color: "var(--t3)", textAlign: "left" }}>
                          {rooms.length} rooms · {rooms.reduce((s, r) => s + r._count.assets, 0)} assets
                        </div>
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transition: "transform 0.2s", transform: isOpen ? "none" : "rotate(-90deg)" }}>
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>

                  {/* Rooms table */}
                  {isOpen && (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "var(--elev)" }}>
                          {["Room", "Floor", "Description", "Assets", ""].map((h) => (
                            <th key={h} style={{
                              padding: "7px 18px", textAlign: "left", fontWeight: 500,
                              fontSize: 10, color: "var(--t3)", textTransform: "uppercase",
                              letterSpacing: "0.07em", borderBottom: "1px solid var(--b1)",
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rooms.map((loc, i) => (
                          <LocationRow
                            key={loc.id}
                            loc={loc}
                            last={i === rooms.length - 1}
                            onEdit={() => setModal({ mode: "edit", item: loc })}
                            onDelete={() => setDeleting(loc)}
                          />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}

            <AddCard onClick={() => setModal({ mode: "add" })} label="Add location" />
          </div>
        )}
      </div>

      {modal && (
        <LocationModal
          mode={modal.mode}
          initial={modal.mode === "edit" ? modal.item : undefined}
          buildings={existingBuildings}
          onSave={handleSave}
          onClose={() => setModal(null)}
          loading={modalLoading}
        />
      )}

      {deleting && (
        <ConfirmModal
          title="Delete location"
          body={`Delete "${deleting.building} / ${deleting.room}"? Assets assigned here will have no location.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
