import { useEffect, useMemo, useState } from "react";
import { getStaff, type StaffProfile } from "../../api/staff";

type Task = {
  id: string;
  title: string;
  assignedTo: string;
  status: string;
};

const STORAGE_KEY = "clibtask_admin_tasks_v1";

export default function AdminDashboard() {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const rows = await getStaff();
        if (!alive) return;

        setStaff(rows);

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setTasks(JSON.parse(stored));
        }
      } catch (e) {
        if (!alive) return;
        setError((e as Error)?.message || "Failed to load data.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ===== METRICS =====
  const libraryStaff = staff.filter((s) => s.role !== "admin");

  const totalStaff = libraryStaff.length;

  const activeTasks = tasks.filter(
    (t) => t.status === "In Progress"
  ).length;

  const completedTasks = tasks.filter(
    (t) => t.status === "Completed"
  ).length;

  const availableStaff = useMemo(() => {
    const busyStaffIds = new Set(
      tasks
        .filter((t) => t.status === "In Progress")
        .map((t) => t.assignedTo)
    );

    return libraryStaff.filter((s) => !busyStaffIds.has(s.id)).length;
  }, [tasks, libraryStaff]);

  // ===== RECENT ACTIVITY (mock from tasks) =====
  const recentActivity = tasks.slice(-5).reverse();

  return (
    <div className="adm-dashboard">
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}

      {/* ===== HEADER ===== */}
      <div className="adm-dash-header">
        <div>
          <h1>Dashboard</h1>
          <p>Here’s what’s happening in the library today.</p>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="adm-stats-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-title">Total Staff</div>
          <div className="adm-stat-value">{totalStaff}</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-title">Staff Available</div>
          <div className="adm-stat-value">{availableStaff}</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-title">Active Tasks</div>
          <div className="adm-stat-value">{activeTasks}</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-title">Completed Tasks</div>
          <div className="adm-stat-value">{completedTasks}</div>
        </div>
      </div>

      {/* ===== MAIN GRID ===== */}
      <div className="adm-main-grid">
        {/* STAFF LIST */}
        <div className="adm-panel">
          <h3>Library Staff</h3>
          {libraryStaff.map((s) => (
            <div key={s.id} className="adm-staff-row">
              {(s.full_name && s.full_name.trim()) ||
                `User ${s.id.slice(0, 6)}…`}
            </div>
          ))}
        </div>

        {/* RECENT ACTIVITY */}
        <div className="adm-panel">
          <h3>Recent Activity</h3>

          {recentActivity.length === 0 && (
            <div style={{ opacity: 0.6 }}>
              No recent activity.
            </div>
          )}

          {recentActivity.map((task) => (
            <div key={task.id} className="adm-activity-row">
              <div className="adm-activity-title">
                {task.title}
              </div>
              <div className="adm-activity-sub">
                Status: {task.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}