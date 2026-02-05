import { useNavigate } from "react-router-dom";
export default function Dashboard() {
  const navigate = useNavigate();
  // sample cards (replace with your real data later)
  const cards = [
    { code: "TASK-001", title: "(Placeholder)", status: "Open", owner: "(Placeholdername)" },
    { code: "TASK-002", title: "(Placeholder)", status: "Open", owner: "(Placeholdername)" },
    { code: "TASK-003", title: "(Placeholder)", status: "Open", owner: "(Placeholdername)" },
    { code: "TASK-004", title: "(Placeholder)", status: "Open", owner: "(Placeholdername)" },
    { code: "TASK-005", title: "(Placeholder)", status: "Open", owner: "(Placeholdername)" },
    { code: "TASK-006", title: "(Placeholder)", status: "Open", owner: "(Placeholdername)" },
  ];

  return (
    <div className="app-shell">
      {/* LEFT SIDEBAR */}
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
          <button className="nav-item active">Dashboard</button>
          <button type="button"className="nav-item"onClick={() => navigate("/admin/tasks")}>Tasks</button>
          <button className="nav-item"onClick={() => navigate("/admin/create-tasks")}>Create Task</button>

          <button className="nav-item">Tags</button>
          <button className="nav-item">Reports</button>
        </nav>

        <div className="side-footer">
          <button className="nav-item danger" onClick={() => navigate("/login")}>Sign Out</button>
          <div className="side-small">Privacy • Terms • Accessibility</div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        {/* TOP BAR */}
        <header className="topbar">
          <h1 className="page-title">Dashboard</h1>

          <div className="top-actions">
            <div className="search">
              <span className="search-ico">🔎</span>
              <input placeholder="Search tasks" />
            </div>

            <button className="ghost-btn">Task Catalog</button>
          </div>
        </header>

        {/* CONTENT */}
        <section className="content">
          <div className="toolbar">
            <div className="toolbar-left">
              <span className="muted">80 results</span>
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
              <article key={c.code} className="card">
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
