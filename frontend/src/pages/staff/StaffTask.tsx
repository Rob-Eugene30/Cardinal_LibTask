import { useEffect, useState } from "react";
import { listTasks, updateTaskStatus, type Task } from "../../api/tasks";
import { getSession } from "../../lib/auth";

type TaskStatus = "Not Yet Started" | "In Progress" | "Finished" | "Abolished";

export default function StaffTask() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const session = getSession();
      const res = await listTasks();
      const mine = session ? res.items.filter((t) => t.assigned_to === session.user_id) : [];
      setTasks(mine);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: TaskStatus) => {
    await updateTaskStatus(id, status);
    await load();
  };

  const getStatusClass = (status: string | null | undefined) => {
    switch (status) {
      case "Not Yet Started":
        return "red";
      case "In Progress":
        return "yellow";
      case "Finished":
        return "green";
      case "Abolished":
        return "gray";
      default:
        return "";
    }
  };

  const dueLabel = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div>
      <h1 style={{ marginBottom: "24px" }}>My Tasks</h1>

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
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800')",
                }}
              />

              <div className="task-tile__body">
                <div className="task-tile__code">{task.code ?? "TASK"}</div>

                <div className="task-tile__title">{task.title}</div>

                <div className="task-tile__meta">
                  <span className={`stf-badge ${getStatusClass(task.status)}`}>
                    {task.status ?? "—"}
                  </span>

                  <span className="task-tile__due">Due: {dueLabel(task.due_date)}</span>
                </div>

                <div className="stf-actions">
                  <button className="stf-action-btn" onClick={() => updateStatus(task.id, "Not Yet Started")}>
                    Not Yet Started
                  </button>

                  <button className="stf-action-btn" onClick={() => updateStatus(task.id, "In Progress")}>
                    In Progress
                  </button>

                  <button className="stf-action-btn" onClick={() => updateStatus(task.id, "Finished")}>
                    Finished
                  </button>

                  <button className="stf-action-btn" onClick={() => updateStatus(task.id, "Abolished")}>
                    Abolished
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
