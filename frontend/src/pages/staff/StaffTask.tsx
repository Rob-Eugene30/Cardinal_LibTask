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

export default function StaffTask() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setTasks(JSON.parse(stored));
    } else {
      const initial: Task[] = [
        {
          id: "1",
          code: "TASK-001",
          title: "Organize Library Files",
          due: "March 2, 2026",
          status: "Not Yet Started",
        },
      ];
      setTasks(initial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }
  }, []);

  const updateStatus = (id: string, status: TaskStatus) => {
    const updated = tasks.map(task =>
      task.id === id ? { ...task, status } : task
    );

    setTasks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const getStatusClass = (status: TaskStatus) => {
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

  return (
    <div>
      <h1 style={{ marginBottom: "24px" }}>My Tasks</h1>

      <div className="task-grid">
        {tasks.map(task => (
          <div key={task.id} className="task-tile">
            
            <div
              className="task-tile__image"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800')",
              }}
            />

            <div className="task-tile__body">

              <div className="task-tile__code">{task.code}</div>

              <div className="task-tile__title">{task.title}</div>

              <div className="task-tile__meta">
                <span className={`stf-badge ${getStatusClass(task.status)}`}>
                  {task.status}
                </span>

                <span className="task-tile__due">
                  Due: {task.due}
                </span>
              </div>

              <div className="stf-actions">
                <button
                  className="stf-action-btn"
                  onClick={() => updateStatus(task.id, "Not Yet Started")}
                >
                  Not Yet Started
                </button>

                <button
                  className="stf-action-btn"
                  onClick={() => updateStatus(task.id, "In Progress")}
                >
                  In Progress
                </button>

                <button
                  className="stf-action-btn"
                  onClick={() => updateStatus(task.id, "Finished")}
                >
                  Finished
                </button>

                <button
                  className="stf-action-btn"
                  onClick={() => updateStatus(task.id, "Abolished")}
                >
                  Abolished
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
