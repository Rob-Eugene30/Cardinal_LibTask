import { useEffect, useState } from "react";

import { listTasks, updateTaskStatus, type Task } from "../../api/tasks";
import { getSession } from "../../lib/auth";
import { formatDate } from "../../lib/format";
import { getTaskBadgeTone, getTaskStatusLabel, type TaskStatusLabel } from "../../types/task";

const STATUS_BUTTONS: TaskStatusLabel[] = ["Not Yet Started", "In Progress", "Finished", "On Hold", "Abolished"];

export default function StaffTask() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const session = getSession();
      const res = await listTasks();
      const mine = session ? res.items.filter((task) => task.assigned_to === session.user_id) : [];
      setTasks(mine);
    } catch (err) {
      setError((err as Error)?.message ?? "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const handleStatusUpdate = async (id: string, status: TaskStatusLabel) => {
    try {
      await updateTaskStatus(id, status);
      await load();
    } catch (err) {
      setError((err as Error)?.message ?? "Failed to update task status.");
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: "24px" }}>My Tasks</h1>
      {error && <p className="muted">{error}</p>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : tasks.length === 0 ? (
        <div className="stf-task-card">
          <p>No tasks assigned to you yet.</p>
        </div>
      ) : (
        <div className="task-grid">
          {tasks.map((task) => (
            <div key={task.id} className="task-tile">
              <div
                className="task-tile__image"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800')",
                }}
              />

              <div className="task-tile__body">
                <div className="task-tile__code">TASK-{String(task.id).slice(0, 6).toUpperCase()}</div>
                <div className="task-tile__title">{task.title}</div>

                <div className="task-tile__meta">
                  <span className={`stf-badge ${getTaskBadgeTone(task.status)}`}>{getTaskStatusLabel(task.status)}</span>
                  <span className="task-tile__due">Due: {formatDate(task.due_date)}</span>
                </div>

                <div className="stf-actions">
                  {STATUS_BUTTONS.map((label) => (
                <button
                    key={label}
                    className={`stf-action-btn ${task.status === label ? "active" : ""}`}
                    onClick={() => void handleStatusUpdate(task.id, label)}
                    >
  {label}
</button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
