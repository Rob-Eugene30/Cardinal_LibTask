import { useEffect, useMemo, useState } from "react";

import type { ApiError } from "../../api/http";
import { getTagSummary, getStaffSummary, getTasksSummary } from "../../api/reports";
import { getStaff, type StaffProfile } from "../../api/staff";
import type { StaffSummaryResponse, TagSummaryResponse, TasksSummaryResponse } from "../../types/report";

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
  const total = segments.reduce((acc, segment) => acc + clamp(segment.value), 0);

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

  segments.forEach((segment, index) => {
    const percent = (clamp(segment.value) / total) * 100;
    percents.push(percent);
    const end = start + percent;
    stops.push(`${PIE_PALETTE[index]} ${start.toFixed(2)}% ${end.toFixed(2)}%`);
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

function StatCard({ title, value, tone }: { title: string; value: number; tone: StatTone }) {
  return (
    <div className={`rep-stat rep-stat--${tone}`}>
      <div className="rep-stat__top">
        <div className="rep-stat__label">{title}</div>
        <div className="rep-stat__icon" aria-hidden="true">
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
  const [tagSummary, setTagSummary] = useState<TagSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const rows = await getStaff();
        setStaff(rows.filter((member) => member.role === "staff"));
      } catch {
        setStaff([]);
      }
    })();
  }, []);

  const staffNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of staff) map.set(member.id, (member.full_name && member.full_name.trim()) || member.id);
    return map;
  }, [staff]);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);

      const query: { start_date?: string; end_date?: string; staff_id?: string } = {};
      if (filters.start_date) query.start_date = filters.start_date;
      if (filters.end_date) query.end_date = filters.end_date;
      if (filters.staff_id) query.staff_id = filters.staff_id;

      const [taskRes, staffRes, tagRes] = await Promise.all([
        getTasksSummary(query) as Promise<TasksSummaryResponse>,
        getStaffSummary(query) as Promise<StaffSummaryResponse>,
        getTagSummary(query) as Promise<TagSummaryResponse>,
      ]);

      setTasksSummary(taskRes);
      setStaffSummary(staffRes);
      setTagSummary(tagRes);
    } catch (err) {
      setError(err as ApiError);
      setTasksSummary(null);
      setStaffSummary(null);
      setTagSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const selectedStaffRow = useMemo(() => {
    if (!staffSummary || !filters.staff_id) return null;
    return staffSummary.items.find((item) => item.staff_id === filters.staff_id) || null;
  }, [filters.staff_id, staffSummary]);

  const pieSegments = useMemo(() => {
    if (!selectedStaffRow) return [{ label: "Open", value: 0 }, { label: "Closed", value: 0 }];
    return [
      { label: "Open", value: selectedStaffRow.open_tasks },
      { label: "Closed", value: selectedStaffRow.closed_tasks },
    ];
  }, [selectedStaffRow]);

  const pie = useMemo(() => makePieGradient(pieSegments), [pieSegments]);

  const filterSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (filters.start_date && filters.end_date && filters.start_date !== filters.end_date) {
      parts.push(`Date: ${filters.start_date} to ${filters.end_date}`);
    } else if (filters.start_date) {
      parts.push(`Date: ${filters.start_date}`);
    }
    if (filters.staff_id) parts.push(`Staff: ${staffNameById.get(filters.staff_id)}`);
    if (!parts.length) return "Choose a date and staff to filter results.";
    return parts.join(" • ");
  }, [filters.end_date, filters.start_date, filters.staff_id, staffNameById]);

  const topTag = tagSummary?.items?.[0];
  const trackedTagsCount = tagSummary?.items?.length ?? 0;

  return (
    <div className="rep-page">
      <div className="rep-head">
        <div>
          <div className="rep-kicker">Reports</div>
          <h2 className="rep-title">Reports Overview</h2>
          <div className="rep-sub">{filterSubtitle}</div>
        </div>

        <div className="rep-filters">
          <div className="rep-field">
            <label>Start Date</label>
            <input type="date" value={filters.start_date} onChange={(event) => setFilters((prev) => ({ ...prev, start_date: event.target.value }))} />
          </div>

          <div className="rep-field">
            <label>End Date</label>
            <input type="date" value={filters.end_date} onChange={(event) => setFilters((prev) => ({ ...prev, end_date: event.target.value }))} />
          </div>

          <div className="rep-field">
            <label>Staff</label>
            <select value={filters.staff_id} onChange={(event) => setFilters((prev) => ({ ...prev, staff_id: event.target.value }))}>
              <option value="">All Staff</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name || member.id}
                </option>
              ))}
            </select>
          </div>

          <button className="adm-btn-primary rep-apply" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Loading..." : "Apply"}
          </button>
        </div>
      </div>

      {error && <div className="adm-form-error">{error.message || "Failed to load reports."}</div>}

      <div className="rep-stats">
        <StatCard title="Total Tasks" value={tasksSummary?.total_tasks ?? 0} tone="neutral" />
        <StatCard title="Open Tasks" value={tasksSummary?.open_tasks ?? 0} tone="warn" />
        <StatCard title="Closed Tasks" value={tasksSummary?.closed_tasks ?? 0} tone="good" />
      </div>

      <div className="rep-grid-2">
        <div className="rep-card">
          <div className="rep-card__head">
            <div>
              <div className="rep-card__title">Day Schedule</div>
              <div className="rep-card__sub">{filters.start_date ? `Date: ${filters.start_date}` : "Select a date"}</div>
            </div>
          </div>

          <div className="rep-list">
            {tasksSummary?.by_status?.length ? (
              tasksSummary.by_status.map((status) => (
                <div key={status.label} className="rep-list__row">
                  <div className="rep-list__label">{status.label}</div>
                  <div className="rep-list__value">{status.count}</div>
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
              <div className="rep-card__sub">Tag-based analytics from current task data.</div>
            </div>
          </div>

          <div className="rep-soon">
            <div className="rep-soon__box">
              <div className="rep-soon__title">Top Tag</div>
              <div className="rep-soon__sub">{topTag ? `${topTag.tag} • ${topTag.total_tasks} task(s)` : "No tag data yet"}</div>
            </div>
            <div className="rep-soon__box">
              <div className="rep-soon__title">Tracked Tags</div>
              <div className="rep-soon__sub">{trackedTagsCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rep-grid-2 rep-grid-2--wide">
        <div className="rep-card">
          <div className="rep-card__head rep-card__head--split">
            <div>
              <div className="rep-card__title">Staff Breakdown</div>
              <div className="rep-card__sub">{filters.staff_id ? `Staff: ${staffNameById.get(filters.staff_id)}` : "Select a staff member"}</div>
            </div>
            <div className="rep-pill">Total: {pie.total}</div>
          </div>

          <div className="rep-pie-wrap">
            <div className="rep-pie" style={{ background: pie.gradient }} />

            <div className="rep-legend">
              {pieSegments.map((segment, index) => (
                <div key={segment.label} className="rep-legend__row">
                  <div className="rep-legend__left">
                    <span className="rep-dot" style={{ background: pie.colors[index] }} />
                    {segment.label}
                  </div>
                  <div className="rep-legend__right">
                    {clamp(segment.value)} ({(pie.percents[index] ?? 0).toFixed(1)}%)
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
                    <tr key={row.staff_id} className={active ? "is-active" : ""} onClick={() => setFilters((prev) => ({ ...prev, staff_id: row.staff_id }))}>
                      <td>{name}</td>
                      <td>{row.total_tasks}</td>
                      <td>{row.open_tasks}</td>
                      <td>{row.closed_tasks}</td>
                    </tr>
                  );
                })}
                {!(staffSummary?.items || []).length && (
                  <tr>
                    <td colSpan={4}>No staff report data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
