import { useEffect, useMemo, useState } from "react";
import { listTasks } from "../../api/tasks";
import type { Task } from "../../api/tasks";

import "../../components/layout/AdminLayout.css"; 

type TaskStatus = "Not Yet Started" | "In Progress" | "Finished" | "On Hold";

function normalizeStatus(s: any): TaskStatus {
  const v = (s ?? "").toString().trim();
  if (v === "In Progress") return "In Progress";
  if (v === "Finished") return "Finished";
  if (v === "On Hold") return "On Hold";
  return "Not Yet Started";
}

function statusClass(status: TaskStatus) {
  switch (status) {
    case "Not Yet Started":
      return "status-not";
    case "In Progress":
      return "status-progress";
    case "Finished":
      return "status-finished";
    case "On Hold":
      return "status-hold";
  }
}

function formatDue(dueISO?: string | null) {
  if (!dueISO) return "—";
  const date = new Date(dueISO);
  if (Number.isNaN(date.getTime())) return dueISO;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AdminTasks() {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | TaskStatus>("All");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res: any = await listTasks();
      const rows: Task[] = Array.isArray(res) ? res : res?.items ?? [];
      setItems(rows);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const tasksForUI = useMemo(() => {
    const mapped = items.map((t: any) => {
      const status = normalizeStatus(t.status);
      return {
        ...t,
        _status: status,
        _code: t.code || `TASK-${String(t.id).slice(0, 3).toUpperCase()}`,
        _dueText: formatDue(t.due_date),
      };
    });

    if (filter === "All") return mapped;
    return mapped.filter((t) => t._status === filter);
  }, [items, filter]);

  return (
    <div className="adm-content">
      {/* ===== HEADER BAR ===== */}
      <div className="adm-tasks-header">
        <div>
          <h1 className="adm-tasks-title">All Tasks</h1>
          <p className="adm-tasks-sub">
            View and track all tasks assigned in the system.
          </p>
        </div>

        <div className="adm-tasks-actions">
          <select
            className="adm-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="All">All Status</option>
            <option value="Not Yet Started">Not Yet Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Finished">Finished</option>
            <option value="On Hold">On Hold</option>
          </select>

          <button className="adm-btn-primary" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ===== ERROR ===== */}
      {err && <div className="adm-form-error">{err}</div>}

      {/* ===== CONTENT ===== */}
      {loading ? (
        <p style={{ opacity: 0.7, fontWeight: 600 }}>Loading tasks...</p>
      ) : tasksForUI.length === 0 ? (
        <div className="adm-empty-card">
          <div className="adm-empty-title">No tasks found</div>
          <div className="adm-empty-sub">Try changing the filter or refresh.</div>
        </div>
      ) : (
        <div className="adm-task-grid">
          {tasksForUI.map((t: any) => (
            <div key={t.id} className="adm-task-card">
              <div className="adm-task-top">
                <div className="adm-task-code">{t._code}</div>
                <span className={`adm-status ${statusClass(t._status)}`}>
                  {t._status}
                </span>
              </div>

              <div className="adm-task-name">{t.title}</div>

              <div className="adm-task-row">
                <span className="adm-task-label">Due</span>
                <span className="adm-task-value">{t._dueText}</span>
              </div>

              <div className="adm-task-row">
                <span className="adm-task-label">Assigned To</span>
                <span className="adm-task-value">{t.assigned_to || "—"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}