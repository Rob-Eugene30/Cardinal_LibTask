import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Task = {
  id: string;
  title: string;
  dueISO: string;
  timezoneLabel: string;
  course: string;
  color: "green" | "blue" | "purple";
  status: "Open" | "In Progress" | "Done";
};

const STORAGE_KEY = "clibtask_admin_tasks_v1";

export default function Dashboard() {
  const navigate = useNavigate();

  // fallback cards if localStorage is empty
  const fallbackCards = [
    { code: "TASK-001", title: "(Placeholder)", status: "Open", owner: "(Placeholdername)" },
    { code: "TASK-002", title: "(Placeholder)", status: "Open", owner: "(Placeholdername)" },
    { code: "TASK-003", title: "(Placeholder)", status: "Open", owner: "(Placeholdername)" },
    { code: "TASK-004", title: "(Placeholder)", status: "Open", owner: "(Placeholdername)" },
    { code: "TASK-005", title: "(Placeholder)", status: "Open", owner: "(Placeholdername)" },
    { code: "TASK-006", title: "(Placeholder)", status: "Open", owner: "(Placeholdername)" },
  ];

  const [tasks, setTasks] = useState<Task[]>([]);

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

  // load initially + when tasks are updated (same-tab)
  useEffect(() => {
    loadTasks();

    const refresh = () => loadTasks();
    window.addEventListener("clibtask_tasks_updated", refresh);

    // also refresh when coming back to this tab
    const onFocus = () => loadTasks();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("clibtask_tasks_updated", refresh);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Convert tasks into dashboard card format (keep look)
  const cards = useMemo(() => {
    if (!tasks.length) return fallbackCards;

    // show latest 6
    return tasks.slice(0, 6).map((t) => ({
      code: t.id,
      title: t.title || "(Placeholder)",
      status: t.status,
      owner: t.course || "(Placeholder Course / Context)",
    }));
  }, [tasks]);

  const resultCount = tasks.length ? tasks.length : 80; // keep your original "80 results" look if empty

  return (
    <div className="app-shell">
      {/* THE LEFT SIDEBAR */}
      <aside className="side">
        <div className="side-brand">
          <div className="side-logo">CL</div>
          <div className="side-text">
            <div className="side-title">Cardinal</div>
            <div className="side-sub">LibTask Admin</div>
          </div>
        </div>

        <div className="side-user">
          <div className="avatar">A</div>
          <div className="user-meta">
            <div className="user-name">ADMIN USER</div>
            <div className="user-role">Administrator</div>
          </div>
        </div>

        <nav className="side-nav">
          <button type="button" className="nav-item active" onClick={() => navigate("/admin/dashboard")}>
            Dashboard
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => navigate("/admin/tasks")}
          >
            Tasks
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => navigate("/admin/create-tasks")}
          >
            Create Task
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => navigate("/admin/tags")}
          >
            Tags
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => navigate("/admin/reports")}
          >
            Reports
          </button>
        </nav>

        <div className="side-footer">
          <button className="nav-item danger" onClick={() => navigate("/login")}>
            Sign Out
          </button>
          <div className="side-small">Privacy • Terms • Accessibility</div>
        </div>
      </aside>

      {/* THE MAIN */}
      <main className="main">
        {/* TOP BAR */}
        <header className="topbar">
          <h1 className="page-title">Dashboard</h1>

          <div className="top-actions">
            <div className="search">
              <span className="search-ico">🔎</span>
              <input placeholder="Search tasks" />
            </div>

            <button className="ghost-btn" onClick={() => navigate("/admin/tasks")}>
              Task Catalog
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <section className="content">
          <div className="toolbar">
            <div className="toolbar-left">
              <span className="muted">{resultCount} results</span>
            </div>

            <div className="toolbar-right">
              <select className="select">
                <option>All Terms</option>
                <option>Q1</option>
                <option>Q2</option>
              </select>

              <select className="select">
                <option>All tasks</option>
                <option>Open</option>
                <option>In Progress</option>
                <option>Done</option>
              </select>

              <select className="select">
                <option>25</option>
                <option>50</option>
                <option>100</option>
              </select>
              <span className="muted">items per page</span>
            </div>
          </div>

          <div className="grid">
            {cards.map((c) => (
              <article
                key={c.code}
                className="card"
                onClick={() => navigate("/admin/tasks")}
                style={{ cursor: "pointer" }}
              >
                <div className="thumb" />
                <div className="card-body">
                  <div className="card-code">{c.code}</div>
                  <div className="card-title">{c.title}</div>
                  <div className="card-status">{c.status}</div>
                  <div className="card-divider" />
                  <div className="card-owner">{c.owner}</div>
                </div>
                <button className="card-fav" title="Favorite" aria-label="Favorite">
                  ☆
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
