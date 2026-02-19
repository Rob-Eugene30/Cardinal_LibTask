import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Task = {
  id: string;
  title: string;
  course: string;
  dueISO: string;
  status: string;
};

const STORAGE_KEY = "clibtask_admin_tasks_v1";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setTasks(JSON.parse(stored));
    }
  }, []);

  const updateStatus = (id: string, status: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, status } : t
    );
    setTasks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <div className="adm-content">
      <h2 style={{ fontWeight: 800, marginBottom: 24 }}>
        My Tasks
      </h2>

      <div className="adm-grid">
        {tasks.map((task) => (
          <div key={task.id} className="task-card">
            
            {/* Clickable area */}
            <div
              className="task-card__body"
             onClick={() => navigate(`/staff/${task.id}`)}
            >
              <div className="task-card__title">
                {task.title}
              </div>

              <div className="task-card__course">
                {task.course}
              </div>

              <div className="task-card__due">
                Due: {new Date(task.dueISO).toLocaleString()}
              </div>
            </div>

            {/* STATUS BUTTONS */}
            <div className="task-card__actions">
              <button
                className="status-btn"
                onClick={() => updateStatus(task.id, "Not Yet Started")}
              >
                Not Yet Started
              </button>

              <button
                className="status-btn"
                onClick={() => updateStatus(task.id, "In Progress")}
              >
                In Progress
              </button>

              <button
                className="status-btn danger"
                onClick={() => updateStatus(task.id, "Abolished")}
              >
                Abolished
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
