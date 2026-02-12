import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type TasksSummary = {
  generated_at: string;
  filters: { start_date: string | null; end_date: string | null };
  total_tasks: number;
  open_tasks: number;
  closed_tasks: number;
  by_status: { label: string; count: number }[];
};

type StaffSummary = {
  generated_at: string;
  filters: { start_date: string | null; end_date: string | null };
  items: { staff_id: string; total_tasks: number; open_tasks: number; closed_tasks: number }[];
};

type TagSummary = {
  generated_at: string;
  filters: { start_date: string | null; end_date: string | null };
  items: { tag: string; total_tasks: number }[];
};

export default function Reports() {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [tasks, setTasks] = useState<TasksSummary | null>(null);
  const [staff, setStaff] = useState<StaffSummary | null>(null);
  const [tags, setTags] = useState<TagSummary | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const q: any = {};
    if (startDate) q.start_date = startDate;
    if (endDate) q.end_date = endDate;
    return q;
  }, [startDate, endDate]);

  async function loadReports() {
    setLoading(true);
    setError(null);

    try {
      const api = await import("../../api/reports");

      const [tasksRes, staffRes, tagRes] = await Promise.all([
        api.getTasksSummary(query),
        api.getStaffSummary(query),
        api.getTagSummary(query),
      ]);

      setTasks(tasksRes as TasksSummary);
      setStaff(staffRes as StaffSummary);
      setTags(tagRes as TagSummary);
    } catch (e: any) {
      // show full backend message if present
      setError(e?.message ?? String(e));
      setTasks(null);
      setStaff(null);
      setTags(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-shell">
      {/* LEFT SIDEBAR (same as Dashboard) */}
      <aside className="side">
        <div className="side-brand">
          <div className="side-logo">CL</div>
          <div className="side-text">
            <div className="side-title">Cardinal</div>
            <div className="side-sub">LibTask Admin</div>
          </div>
        </div>

        <div className="side-user">
          <div className="avatar">A</div>
          <div className="user-meta">
            <div className="user-name">ADMIN USER</div>
            <div className="user-role">Administrator</div>
          </div>
        </div>

        <nav className="side-nav">
          <button type="button" className="nav-item" onClick={() => navigate("/admin/dashboard")}>
            Dashboard
          </button>

          <button type="button" className="nav-item" onClick={() => navigate("/admin/tasks")}>
            Tasks
          </button>

          <button type="button" className="nav-item" onClick={() => navigate("/admin/create-tasks")}>
            Create Task
          </button>

          <button type="button" className="nav-item" onClick={() => navigate("/admin/tags")}>
            Tags
          </button>

          <button type="button" className="nav-item active" onClick={() => navigate("/admin/reports")}>
            Reports
          </button>
        </nav>

        <div className="side-footer">
          <button className="nav-item danger" onClick={() => navigate("/login")}>
            Sign Out
          </button>
          <div className="side-small">Privacy • Terms • Accessibility</div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <header className="topbar">
          <h1 className="page-title">Reports</h1>

          <div className="top-actions">
            <button className="ghost-btn" onClick={loadReports} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </header>

        <section className="content reports-page">
          {/* FILTER BAR */}
          <div className="reports-filters">
            <div className="reports-field">
              <div className="field-label">Start date</div>
              <input className="field" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="reports-field">
              <div className="field-label">End date</div>
              <input className="field" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div className="reports-actions">
              <button className="primary-btn" onClick={loadReports} disabled={loading}>
                Apply
              </button>

              <button
                className="ghost-btn"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setTimeout(loadReports, 0);
                }}
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="reports-alert">
              <strong>API Error:</strong> {error}
              <div className="reports-alert-hint">
                Tip: “Missing Bearer token” means your frontend is not sending Authorization header yet.
              </div>
            </div>
          )}

          {/* SUMMARY CARDS */}
          <div className="reports-cards">
            <div className="reports-card">
              <div className="reports-card-label">Total Tasks</div>
              <div className="reports-card-value">{tasks?.total_tasks ?? "—"}</div>
            </div>
            <div className="reports-card">
              <div className="reports-card-label">Open Tasks</div>
              <div className="reports-card-value">{tasks?.open_tasks ?? "—"}</div>
            </div>
            <div className="reports-card">
              <div className="reports-card-label">Closed Tasks</div>
              <div className="reports-card-value">{tasks?.closed_tasks ?? "—"}</div>
            </div>
            <div className="reports-card soft">
              <div className="reports-card-label">Generated</div>
              <div className="reports-card-value small">
                {tasks?.generated_at ? new Date(tasks.generated_at).toLocaleString() : "—"}
              </div>
            </div>
          </div>

          {/* SECTIONS */}
          <div className="reports-grid">
            <div className="reports-panel">
              <div className="reports-panel-title">Tasks by Status</div>

              {!tasks ? (
                <div className="muted">No data</div>
              ) : (
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.by_status.map((r) => (
                      <tr key={r.label}>
                        <td style={{ textTransform: "capitalize" }}>{r.label}</td>
                        <td style={{ textAlign: "right", fontWeight: 900 }}>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="reports-panel">
              <div className="reports-panel-title">Staff Summary</div>

              {!staff ? (
                <div className="muted">No data</div>
              ) : (
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Staff ID</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                      <th style={{ textAlign: "right" }}>Open</th>
                      <th style={{ textAlign: "right" }}>Closed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.items.map((r) => (
                      <tr key={r.staff_id}>
                        <td className="mono">{r.staff_id}</td>
                        <td style={{ textAlign: "right" }}>{r.total_tasks}</td>
                        <td style={{ textAlign: "right" }}>{r.open_tasks}</td>
                        <td style={{ textAlign: "right" }}>{r.closed_tasks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="reports-panel">
              <div className="reports-panel-title">Tag Summary</div>

              {!tags ? (
                <div className="muted">No data</div>
              ) : (
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Tag</th>
                      <th style={{ textAlign: "right" }}>Total Tasks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tags.items.map((r) => (
                      <tr key={r.tag}>
                        <td>{r.tag}</td>
                        <td style={{ textAlign: "right", fontWeight: 900 }}>{r.total_tasks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
