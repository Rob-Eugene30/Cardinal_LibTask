import { useEffect, useState } from "react";

type TaskStatus =
  | "Not Yet Started"
  | "In Progress"
  | "Finished"
  | "Abolished";

type Task = {
  id: string;
  code: string;
  title: string;
  due: string;
  status: TaskStatus;
};

const STORAGE_KEY = "clibtask_staff_tasks_v1";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setTasks(JSON.parse(stored));
    }
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
            .sort(
              (a, b) =>
                new Date(a.due).getTime() - new Date(b.due).getTime()
            )
            .map(task => {
              const dueDate = new Date(task.due);
              dueDate.setHours(0, 0, 0, 0);

              const diff = Math.ceil(
                (dueDate.getTime() - today.getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              let timeLabel = "";

              if (diff === 0) timeLabel = "Today";
              else if (diff === 1) timeLabel = "Tomorrow";
              else if (diff > 1) timeLabel = `${diff} days`;
              else timeLabel = "Overdue";

              return (
                <div key={task.id} className="stf-activity-item">

                  <div className="stf-activity-time">
                    {timeLabel}
                  </div>

                  <div className="stf-activity-card">
                    <div className="stf-activity-title">
                      {task.title}
                    </div>

                    <div className="stf-activity-meta">
                      Due Date: {task.due}
                    </div>
                  </div>

                </div>
              );
            })
        )}

      </div>

    </div>
  );
}
