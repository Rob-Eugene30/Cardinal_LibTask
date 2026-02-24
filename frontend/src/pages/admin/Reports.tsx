import { useEffect, useMemo, useState } from "react";
import type { ApiError } from "../../api/http";
import { getStaff, type StaffProfile } from "../../api/staff";
import { getStaffSummary, getTasksSummary } from "../../api/reports";
import type { StaffSummaryResponse, TasksSummaryResponse } from "../../types/report";

type Filters = {
  start_date: string;
  end_date: string;
  staff_id: string;
};

type StatTone = "neutral" | "warn" | "good";

function clamp(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

const PIE_PALETTE = ["#60a5fa", "#34d399"];

function makePieGradient(segments: { label: string; value: number }[]) {
  const total = segments.reduce((a, s) => a + clamp(s.value), 0);

  if (total <= 0) {
    return {
      total: 0,
      percents: segments.map(() => 0),
      gradient: "conic-gradient(#e5e7eb 0 100%)",
      colors: PIE_PALETTE,
    };
  }

  let start = 0;
  const stops: string[] = [];
  const percents: number[] = [];

  segments.forEach((s, i) => {
    const p = (clamp(s.value) / total) * 100;
    percents.push(p);
    const end = start + p;
    stops.push(`${PIE_PALETTE[i]} ${start.toFixed(2)}% ${end.toFixed(2)}%`);
    start = end;
  });

  if (start < 100) stops.push(`#e5e7eb ${start.toFixed(2)}% 100%`);

  return {
    total,
    percents,
    colors: PIE_PALETTE,
    gradient: `conic-gradient(${stops.join(", ")})`,
  };
}

function StatCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: StatTone;
}) {
  return (
    <div className={`rep-stat rep-stat--${tone}`}>
      <div className="rep-stat__top">
        <div className="rep-stat__label">{title}</div>
        <div className="rep-stat__icon" aria-hidden="true">
          {/* simple icon blocks so no extra libs */}
          <span />
        </div>
      </div>
      <div className="rep-stat__value">{value}</div>
    </div>
  );
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
    (async () => {
      try {
        const rows = await getStaff();
        setStaff(rows.filter((s) => s.role === "staff"));
      } catch {}
    })();
  }, []);

  const staffNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of staff) m.set(s.id, (s.full_name && s.full_name.trim()) || s.id);
    return m;
  }, [staff]);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);

      const q: { start_date?: string; end_date?: string; staff_id?: string } = {};

      if (filters.start_date) q.start_date = filters.start_date;
      if (filters.end_date) q.end_date = filters.end_date;
      if (filters.staff_id) q.staff_id = filters.staff_id;

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
  }, []);

  const selectedStaffRow = useMemo(() => {
    if (!staffSummary || !filters.staff_id) return null;
    return staffSummary.items.find((x) => x.staff_id === filters.staff_id) || null;
  }, [staffSummary, filters.staff_id]);

  const pieSegments = useMemo(() => {
    if (!selectedStaffRow) return [{ label: "No data", value: 1 }];
    return [
      { label: "Open", value: selectedStaffRow.open_tasks },
      { label: "Closed", value: selectedStaffRow.closed_tasks },
    ];
  }, [selectedStaffRow]);

  const pie = useMemo(() => makePieGradient(pieSegments), [pieSegments]);

  const filterSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (filters.start_date) parts.push(`Date: ${filters.start_date}`);
    if (filters.staff_id) parts.push(`Staff: ${staffNameById.get(filters.staff_id)}`);
    if (!parts.length) return "Choose a date and staff to filter results.";
    return parts.join(" • ");
  }, [filters.start_date, filters.staff_id, staffNameById]);

  return (
    <div className="rep-page">
      {/* Header */}
      <div className="rep-head">
        <div>
          <div className="rep-kicker">Reports</div>
          <h2 className="rep-title">Reports Overview</h2>
          <div className="rep-sub">{filterSubtitle}</div>
        </div>

        <div className="rep-filters">
          <div className="rep-field">
            <label>Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  start_date: e.target.value,
                  end_date: e.target.value,
                }))
              }
            />
          </div>

          <div className="rep-field">
            <label>Staff</label>
            <select
              value={filters.staff_id}
              onChange={(e) => setFilters((f) => ({ ...f, staff_id: e.target.value }))}
            >
              <option value="">All Staff</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name || s.id}
                </option>
              ))}
            </select>
          </div>

          <button className="adm-btn-primary rep-apply" onClick={refresh} disabled={loading}>
            {loading ? "Loading..." : "Apply"}
          </button>
        </div>
      </div>

      {error && <div className="adm-form-error">{error.message || "Failed to load reports."}</div>}

      {/* Stat row */}
      <div className="rep-stats">
        <StatCard title="Total Tasks" value={tasksSummary?.total_tasks ?? 0} tone="neutral" />
        <StatCard title="Open Tasks" value={tasksSummary?.open_tasks ?? 0} tone="warn" />
        <StatCard title="Closed Tasks" value={tasksSummary?.closed_tasks ?? 0} tone="good" />
      </div>

      {/* Row: schedule + analytics */}
      <div className="rep-grid-2">
        <div className="rep-card">
          <div className="rep-card__head">
            <div>
              <div className="rep-card__title">Day Schedule</div>
              <div className="rep-card__sub">
                {filters.start_date ? `Date: ${filters.start_date}` : "Select a date"}
                {filters.staff_id ? ` • Staff: ${staffNameById.get(filters.staff_id)}` : ""}
              </div>
            </div>
          </div>

          <div className="rep-list">
            {tasksSummary?.by_status?.length ? (
              tasksSummary.by_status.map((s) => (
                <div key={s.label} className="rep-list__row">
                  <div className="rep-list__label">{s.label}</div>
                  <div className="rep-list__value">{s.count}</div>
                </div>
              ))
            ) : (
              <div className="rep-empty">
                <div className="rep-empty__title">No tasks scheduled</div>
                <div className="rep-empty__sub">Try a different date or staff.</div>
              </div>
            )}
          </div>
        </div>

        <div className="rep-card">
          <div className="rep-card__head">
            <div>
              <div className="rep-card__title">Analytics Overview</div>
              <div className="rep-card__sub">Charts will appear here once enabled.</div>
            </div>
          </div>

          <div className="rep-soon">
            <div className="rep-soon__box">
              <div className="rep-soon__title">Task Trend</div>
              <div className="rep-soon__sub">Coming soon</div>
            </div>
            <div className="rep-soon__box">
              <div className="rep-soon__title">Task Distribution</div>
              <div className="rep-soon__sub">Coming soon</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row: pie + table */}
      <div className="rep-grid-2 rep-grid-2--wide">
        <div className="rep-card">
          <div className="rep-card__head rep-card__head--split">
            <div>
              <div className="rep-card__title">Staff Breakdown</div>
              <div className="rep-card__sub">
                {filters.staff_id ? `Staff: ${staffNameById.get(filters.staff_id)}` : "All Staff"}
              </div>
            </div>
            <div className="rep-pill">Total: {pie.total}</div>
          </div>

          <div className="rep-pie-wrap">
            <div className="rep-pie" style={{ background: pie.gradient }} />

            <div className="rep-legend">
              {pieSegments.map((s, i) => (
                <div key={i} className="rep-legend__row">
                  <div className="rep-legend__left">
                    <span className="rep-dot" style={{ background: pie.colors[i] }} />
                    {s.label}
                  </div>
                  <div className="rep-legend__right">
                    {clamp(s.value)} ({(pie.percents[i] ?? 0).toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rep-card">
          <div className="rep-card__head">
            <div>
              <div className="rep-card__title">Staff Summary</div>
              <div className="rep-card__sub">Click a row to filter by staff.</div>
            </div>
          </div>

          <div className="rep-table-wrap">
            <table className="rep-table">
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
                  const active = filters.staff_id === row.staff_id;

                  return (
                    <tr
                      key={row.staff_id}
                      className={active ? "is-active" : ""}
                      onClick={() => setFilters((f) => ({ ...f, staff_id: row.staff_id }))}
                    >
                      <td>{name}</td>
                      <td>{row.total_tasks}</td>
                      <td>{row.open_tasks}</td>
                      <td>{row.closed_tasks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}