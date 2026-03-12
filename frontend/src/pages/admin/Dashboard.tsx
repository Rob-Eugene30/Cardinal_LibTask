import { useEffect, useMemo, useState } from "react";

import { getStaff, type StaffProfile } from "../../api/staff";
import { listTasks, type Task } from "../../api/tasks";
import { getTaskStatusLabel, normalizeTaskStatus } from "../../types/task";

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

        const [staffRows, taskRows] = await Promise.all([getStaff(), listTasks()]);
        if (!alive) return;

        setStaff(staffRows);
        setTasks(taskRows.items ?? []);
      } catch (err) {
        if (!alive) return;
        setError((err as Error)?.message || "Failed to load data.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const libraryStaff = useMemo(() => staff.filter((member) => member.role !== "admin"), [staff]);
  const staffNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of libraryStaff) {
      map.set(member.id, (member.full_name ?? "").trim() || member.staff_code || member.id);
    }
    return map;
  }, [libraryStaff]);

  const totalStaff = libraryStaff.length;
  const activeTasks = tasks.filter((task) => normalizeTaskStatus(task.status) === "in_progress").length;
  const completedTasks = tasks.filter((task) => normalizeTaskStatus(task.status) === "done").length;

  const availableStaff = useMemo(() => {
    const busy = new Set(
      tasks.filter((task) => normalizeTaskStatus(task.status) === "in_progress").map((task) => task.assigned_to),
    );
    return libraryStaff.filter((member) => !busy.has(member.id)).length;
  }, [libraryStaff, tasks]);

  const recentActivity = useMemo(() => tasks.slice(0, 5), [tasks]);

  return (
    <div className="adm-dashboard">
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}

      <div className="adm-dash-header">
        <div>
          <h1>Dashboard</h1>
          <p>Here’s what’s happening in the library today.</p>
        </div>
      </div>

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

      <div className="adm-main-grid">
        <div className="adm-panel">
          <h3>Library Staff</h3>
          {libraryStaff.length === 0 ? (
            <div style={{ opacity: 0.6 }}>No staff records found.</div>
          ) : (
            libraryStaff.map((member) => (
              <div key={member.id} className="adm-staff-row">
                {(member.full_name && member.full_name.trim()) || `User ${member.id.slice(0, 6)}…`}
              </div>
            ))
          )}
        </div>

        <div className="adm-panel">
          <h3>Recent Activity</h3>

          {recentActivity.length === 0 && <div style={{ opacity: 0.6 }}>No recent activity.</div>}

          {recentActivity.map((task) => (
            <div key={task.id} className="adm-activity-row">
              <div className="adm-activity-title">{task.title}</div>
              <div className="adm-activity-sub">
                {getTaskStatusLabel(task.status)}
                {task.assigned_to ? ` • ${staffNameById.get(task.assigned_to) ?? task.assigned_to}` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
