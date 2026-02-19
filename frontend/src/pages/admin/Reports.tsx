import { useEffect, useMemo, useState } from "react";
import type { ApiError } from "../../api/http";
import { getStaff, type StaffProfile } from "../../api/staff";
import { getStaffSummary, getTasksSummary } from "../../api/reports";
import type { StaffSummaryResponse, TasksSummaryResponse } from "../../types/report";

type Filters = {
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  staff_id: string; // staff uuid
};

function clamp(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

const PIE_PALETTE = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa"];

function makePieGradient(segments: { label: string; value: number }[]) {
  const total = segments.reduce((a, s) => a + clamp(s.value), 0);

  if (total <= 0) {
    return {
      total: 0,
      percents: segments.map(() => 0),
      gradient: "conic-gradient(#e5e7eb 0 100%)",
      colors: segments.map((_, i) => PIE_PALETTE[i % PIE_PALETTE.length]),
    };
  }

  let start = 0;
  const stops: string[] = [];
  const percents: number[] = [];
  const colors = segments.map((_, i) => PIE_PALETTE[i % PIE_PALETTE.length]);

  segments.forEach((s, i) => {
    const p = (clamp(s.value) / total) * 100;
    percents.push(p);
    const end = start + p;
    stops.push(`${colors[i]} ${start.toFixed(2)}% ${end.toFixed(2)}%`);
    start = end;
  });

  if (start < 100) stops.push(`#e5e7eb ${start.toFixed(2)}% 100%`);

  return { total, percents, colors, gradient: `conic-gradient(${stops.join(", ")})` };
}

export default function Reports() {
  const [filters, setFilters] = useState<Filters>({
    start_date: "",
    end_date: "",
    staff_id: "",
  });

  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [tasksSummary, setTasksSummary] = useState<TasksSummaryResponse | null>(null);
  const [staffSummary, setStaffSummary] = useState<StaffSummaryResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await getStaff();
        if (!alive) return;
        setStaff(rows.filter((s) => s.role === "staff"));
      } catch {
        // ok if staff endpoint isn't available yet
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const staffNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of staff) m.set(s.id, s.full_name || s.id);
    return m;
  }, [staff]);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);

      const q: { start_date?: string; end_date?: string } = {};
      if (filters.start_date) q.start_date = filters.start_date;
      if (filters.end_date) q.end_date = filters.end_date;

      const [ts, ss] = await Promise.all([
        getTasksSummary(q) as Promise<TasksSummaryResponse>,
        getStaffSummary(q) as Promise<StaffSummaryResponse>,
      ]);

      setTasksSummary(ts);
      setStaffSummary(ss);
    } catch (e) {
      setError(e as ApiError);
      setTasksSummary(null);
      setStaffSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedStaffRow = useMemo(() => {
    if (!staffSummary || !filters.staff_id) return null;
    return staffSummary.items.find((x) => x.staff_id === filters.staff_id) || null;
  }, [staffSummary, filters.staff_id]);

  // NOTE: Backend may not yet provide Created/Assigned/Completed/Deleted per staff.
  // This theme-fit UI currently shows Open vs Closed per selected staff (safe with existing reports).
  const pieSegments = useMemo(() => {
    if (!filters.staff_id) return [{ label: "Select staff", value: 1 }];
    if (!selectedStaffRow) return [{ label: "No data", value: 1 }];

    return [
      { label: "Open", value: selectedStaffRow.open_tasks },
      { label: "Closed", value: selectedStaffRow.closed_tasks },
    ];
  }, [filters.staff_id, selectedStaffRow]);

  const pie = useMemo(() => makePieGradient(pieSegments), [pieSegments]);

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Reports</h2>
        <p style={{ margin: "6px 0 0", opacity: 0.8 }}>
          Filter by date range and view per-staff breakdown.
        </p>
      </div>

      {/* Filters */}
      <div
        className="adm-form-card"
        style={{
          maxWidth: "unset",
          padding: 18,
          borderRadius: 16,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
          <div className="adm-form-group" style={{ minWidth: 200 }}>
            <label>Start date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters((f) => ({ ...f, start_date: e.target.value }))}
            />
          </div>

          <div className="adm-form-group" style={{ minWidth: 200 }}>
            <label>End date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters((f) => ({ ...f, end_date: e.target.value }))}
            />
          </div>

          <div className="adm-form-group" style={{ minWidth: 260 }}>
            <label>Staff</label>
            <select
              value={filters.staff_id}
              onChange={(e) => setFilters((f) => ({ ...f, staff_id: e.target.value }))}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontSize: 14,
                outline: "none",
              }}
            >
              <option value="">Select staff</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name || s.id}
                </option>
              ))}
            </select>
          </div>

          <button className="adm-btn-primary" onClick={refresh} style={{ marginTop: 0 }}>
            Apply Filters
          </button>

          <button
            onClick={() =>
              setFilters({
                start_date: "",
                end_date: "",
                staff_id: "",
              })
            }
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>

        {loading && <div style={{ opacity: 0.85, padding: "10px 0 0" }}>Loading reports…</div>}

        {error && (
          <div className="adm-form-error" style={{ marginTop: 12 }}>
            <strong>Error:</strong> {error.message}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="adm-grid" style={{ marginBottom: 14 }}>
        <div className="adm-card" style={{ gridColumn: "span 4", cursor: "default" }}>
          <div className="adm-card__title">Total tasks</div>
          <div className="adm-card__sub">{tasksSummary?.total_tasks ?? "—"}</div>
        </div>

        <div className="adm-card" style={{ gridColumn: "span 4", cursor: "default" }}>
          <div className="adm-card__title">Open tasks</div>
          <div className="adm-card__sub">{tasksSummary?.open_tasks ?? "—"}</div>
        </div>

        <div className="adm-card" style={{ gridColumn: "span 4", cursor: "default" }}>
          <div className="adm-card__title">Closed tasks</div>
          <div className="adm-card__sub">{tasksSummary?.closed_tasks ?? "—"}</div>
        </div>
      </div>

      {/* Pie + Table */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(320px, 420px) 1fr",
          gap: 14,
          alignItems: "start",
        }}
      >
        {/* Pie */}
        <div
          style={{
            background: "var(--adm-card)",
            border: "1px solid var(--adm-card-border)",
            borderRadius: 16,
            padding: 18,
            boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#111827" }}>Pie breakdown</div>
              <div style={{ opacity: 0.75, fontSize: 13, marginTop: 4 }}>
                {filters.staff_id
                  ? `Staff: ${staffNameById.get(filters.staff_id) || filters.staff_id}`
                  : "Select a staff to view breakdown"}
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "white",
                background: "linear-gradient(90deg, var(--adm-accent), var(--adm-accent-dark))",
                padding: "6px 10px",
                borderRadius: 999,
              }}
              title="Sum of segments"
            >
              Total: {pie.total}
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 14, alignItems: "center" }}>
            <div
              style={{
                width: 220,
                height: 220,
                borderRadius: "50%",
                background: pie.gradient,
                border: "1px solid rgba(17,24,39,0.10)",
                boxShadow: "0 12px 22px rgba(0,0,0,0.10)",
              }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, marginBottom: 10, color: "#111827" }}>Legend</div>

              <div style={{ display: "grid", gap: 10 }}>
                {pieSegments.map((s, i) => (
                  <div
                    key={`${s.label}-${i}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(17,24,39,0.08)",
                      background: "#f9fafb",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: pie.colors[i] || "#9ca3af",
                          display: "inline-block",
                        }}
                      />
                      <span style={{ fontWeight: 800, color: "#111827" }}>{s.label}</span>
                    </div>

                    <div style={{ fontWeight: 900, color: "#111827" }}>
                      {clamp(s.value)}
                      <span style={{ opacity: 0.65, fontWeight: 800, marginLeft: 8, fontSize: 12 }}>
                        ({(pie.percents[i] ?? 0).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedStaffRow && (
                <div style={{ marginTop: 12, opacity: 0.75, fontSize: 12 }}>
                  Assigned total: <b>{selectedStaffRow.total_tasks}</b> · Open: <b>{selectedStaffRow.open_tasks}</b> ·
                  Closed: <b>{selectedStaffRow.closed_tasks}</b>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            background: "var(--adm-card)",
            border: "1px solid var(--adm-card-border)",
            borderRadius: 16,
            padding: 18,
            boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
            overflowX: "auto",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16, color: "#111827", marginBottom: 10 }}>Staff summary</div>

          <table className="task-table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Total</th>
                <th>Open</th>
                <th>Closed</th>
              </tr>
            </thead>
            <tbody>
              {(staffSummary?.items || []).map((row) => {
                const name = staffNameById.get(row.staff_id) || row.staff_id;
                const isSelected = filters.staff_id === row.staff_id;

                return (
                  <tr
                    key={row.staff_id}
                    style={{
                      cursor: "pointer",
                      background: isSelected ? "rgba(215, 25, 32, 0.07)" : undefined,
                    }}
                    title="Click to select staff"
                    onClick={() => setFilters((f) => ({ ...f, staff_id: row.staff_id }))}
                  >
                    <td>{name}</td>
                    <td>{row.total_tasks}</td>
                    <td>{row.open_tasks}</td>
                    <td>{row.closed_tasks}</td>
                  </tr>
                );
              })}

              {!loading && !error && (staffSummary?.items?.length || 0) === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 12, opacity: 0.8 }}>
                    No staff data found for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {tasksSummary?.by_status?.length ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: "#111827", marginBottom: 8 }}>
                Overall status counts
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {tasksSummary.by_status.map((s) => (
                  <span
                    key={s.label}
                    style={{
                      border: "1px solid rgba(17,24,39,0.10)",
                      borderRadius: 999,
                      padding: "8px 12px",
                      background: "#f9fafb",
                      fontWeight: 800,
                      color: "#111827",
                    }}
                  >
                    {s.label}: <span style={{ color: "var(--adm-accent)" }}>{s.count}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
