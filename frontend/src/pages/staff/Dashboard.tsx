import { useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  dueISO: string;
  timezoneLabel?: string;
  course: string;
  color: "green" | "blue" | "purple";
  status: "Open" | "In Progress" | "Done";
};

const STORAGE_KEY = "clibtask_admin_tasks_v1";

export default function StaffDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadTasks();

    // auto-refresh when admin adds task (same browser)
    window.addEventListener("storage", loadTasks);
    return () => window.removeEventListener("storage", loadTasks);
  }, []);

  function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setTasks([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Task[];
      setTasks(Array.isArray(parsed) ? parsed : []);
    } catch {
      setTasks([]);
    }
  }

  function updateStatus(id: string, status: Task["status"]) {
    const updated = tasks.map(t =>
      t.id === id ? { ...t, status } : t
    );

    setTasks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className="side">
        <div className="side-brand">
          <div className="side-logo">CL</div>
          <div>
            <div className="side-title">Cardinal</div>
            <div className="side-sub">Staff</div>
          </div>
        </div>

        <div className="side-nav">
          <button className="nav-item active">Dashboard</button>
        </div>

        <div className="side-footer">
          <button
            className="nav-item danger"
            onClick={() => location.href = "/login"}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">

        <div className="topbar">
          <h1 className="page-title">Staff Dashboard</h1>
        </div>

        <div className="content">

          <div className="toolbar">
            <div className="muted">Tasks assigned by admin</div>
          </div>

          <div className="grid">

            {tasks.map(task => (
              <div key={task.id} className="card">

                <div className="thumb"></div>

                <div className="card-body">

                  <div className="card-code">{task.id}</div>
                  <div className="card-title">{task.title}</div>
                  <div className="card-status">{task.status}</div>

                  <div className="card-divider"></div>

                  {/* STATUS BUTTONS */}

                  <div className="status-row">
                    <button
                      className={`pill ${task.status === "Open" ? "pill-open" : ""}`}
                      onClick={() => updateStatus(task.id, "Open")}
                    >
                      Not Started
                    </button>

                    <button
                      className={`pill ${task.status === "In Progress" ? "pill-progress" : ""}`}
                      onClick={() => updateStatus(task.id, "In Progress")}
                    >
                      In Progress
                    </button>

                    <button
                      className={`pill ${task.status === "Done" ? "pill-done" : ""}`}
                      onClick={() => updateStatus(task.id, "Done")}
                    >
                      Done
                    </button>
                  </div>


                  <div className="card-owner" style={{ marginTop: 8 }}>
                    {task.course}
                  </div>

                </div>

              </div>
            ))}

          </div>

        </div>

      </main>
    </div>
  );
}
