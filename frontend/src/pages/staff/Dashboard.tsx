import { useEffect, useState } from "react";
import { listTasks, type Task } from "../../api/tasks";
import { getSession } from "../../lib/auth";
import "../../components/layout/StaffLayout.css";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    (async () => {
      const session = getSession();
      const res = await listTasks();
      const mine = session ? res.items.filter((t) => t.assigned_to === session.user_id) : [];
      setTasks(mine);
    })();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      {/* ================= ANNOUNCEMENTS ================= */}
      <div className="stf-task-card" style={{ marginBottom: "40px" }}>
        <h2 style={{ marginBottom: "12px" }}>Announcements</h2>
        <p>No new announcements at this time.</p>
      </div>

      {/* ================= ACTIVITY STREAM ================= */}
      <h2 style={{ marginBottom: "24px" }}>Activity Stream</h2>

      <div className="stf-activity">
        {tasks.length === 0 ? (
          <div className="stf-task-card">
            <p>No activity available.</p>
          </div>
        ) : (
          tasks
            .slice()
            .sort((a, b) => {
              const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity;
              const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity;
              return ad - bd;
            })
            .map((task) => {
              const dueDate = task.due_date ? new Date(task.due_date) : null;
              if (dueDate) dueDate.setHours(0, 0, 0, 0);

              const diff = dueDate
                ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                : 9999;

              let timeLabel = "";
              if (!dueDate) timeLabel = "No due date";
              else if (diff === 0) timeLabel = "Today";
              else if (diff === 1) timeLabel = "Tomorrow";
              else if (diff > 1) timeLabel = `${diff} days`;
              else timeLabel = "Overdue";

              const dueLabel = task.due_date
                ? new Date(task.due_date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—";

              return (
                <div key={task.id} className="stf-activity-item">
                  <div className="stf-activity-time">{timeLabel}</div>

                  <div className="stf-activity-card">
                    <div className="stf-activity-title">{task.title}</div>
                    <div className="stf-activity-meta">Due Date: {dueLabel}</div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
