import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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

/* helpers */
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDayLabel(d: Date) {
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  return `${days[d.getDay()]} - ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatDueText(d: Date, tzLabel: string) {
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const yy = String(d.getFullYear()).slice(-2);

  let hrs = d.getHours();
  const mins = pad2(d.getMinutes());
  const ampm = hrs >= 12 ? "PM" : "AM";
  hrs = hrs % 12 || 12;

  return `Due: ${mm}/${dd}/${yy}, ${hrs}:${mins} ${ampm} ${tzLabel}`;
}

function defaultPlaceholderTasks(): Task[] {
  return [
    {
      id: "TASK-001",
      title: "(Placeholder Task Title)",
      dueISO: "2026-02-02T23:59:00+08:00",
      timezoneLabel: "(UTC+8)",
      course: "(Placeholder Course / Context)",
      color: "green",
      status: "Open",
    },
    {
      id: "TASK-002",
      title: "(Placeholder Task Title)",
      dueISO: "2026-02-03T21:00:00+08:00",
      timezoneLabel: "(UTC+8)",
      course: "(Placeholder Course / Context)",
      color: "blue",
      status: "In Progress",
    },
  ];
}

export default function Tasks() {
  const navigate = useNavigate();
  const location = useLocation();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | Task["status"]>("All");

  function loadTasksFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      setTasks(defaultPlaceholderTasks());
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Task[];
      if (Array.isArray(parsed)) {
        setTasks(parsed.length ? parsed : defaultPlaceholderTasks());
      } else {
        setTasks(defaultPlaceholderTasks());
      }
    } catch {
      setTasks(defaultPlaceholderTasks());
    }
  }

  // ✅ Reload whenever you ENTER this page (route changes)
  useEffect(() => {
    if (location.pathname === "/admin/tasks") {
      loadTasksFromStorage();
    }
  }, [location.pathname]);

  // ✅ storage event (fires in OTHER tabs)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) loadTasksFromStorage();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ✅ custom event (fires in SAME tab) — required!
  useEffect(() => {
    const refresh = () => loadTasksFromStorage();
    window.addEventListener("clibtask_tasks_updated", refresh);
    return () => window.removeEventListener("clibtask_tasks_updated", refresh);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return tasks
      .filter((t) => (statusFilter === "All" ? true : t.status === statusFilter))
      .filter((t) =>
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.course.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(a.dueISO).getTime() - new Date(b.dueISO).getTime());
  }, [tasks, query, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of filtered) {
      const d = new Date(t.dueISO);
      const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      label: formatDayLabel(new Date(items[0].dueISO)),
      items,
    }));
  }, [filtered]);

  function deleteTask(id: string) {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("clibtask_tasks_updated"));
  }

  return (
    <div className="tasks-page">
      <div className="tasks-top">
        <button className="back-btn" onClick={() => navigate("/admin/dashboard")}>
          ← Back
        </button>

        <div className="tasks-head">
          <h2 className="tasks-title">Tasks</h2>
          <p className="tasks-sub">View and monitor assigned tasks</p>
        </div>
      </div>

      <div className="tasks-controls">
        <div className="tasks-search">
          <span className="search-ico">🔎</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, title, or course"
          />
        </div>

        <select
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="All">All statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </div>

      <div className="tasks-list">
        <div className="muted" style={{ marginBottom: 8 }}>
          {filtered.length} result(s)
        </div>

        {grouped.map((group) => (
          <section key={group.key} className="tasks-day">
            <div className="tasks-day-label">{group.label}</div>

            <div className="tasks-day-cards">
              {group.items.map((t) => {
                const d = new Date(t.dueISO);
                return (
                  <article key={t.id} className={`due-card due-${t.color}`}>
                    <div className="due-icon">☑</div>

                    <div className="due-main">
                      <div className="due-title">{t.title}</div>
                      <div className="due-meta">
                        <span>{formatDueText(d, t.timezoneLabel)}</span>
                        <span className="dot">•</span>
                        <span className="due-link">{t.course}</span>
                        <span className="dot">•</span>
                        <span className="pill">{t.status}</span>
                        <span className="dot">•</span>
                        <span className="id">{t.id}</span>
                      </div>
                    </div>

                    <button className="card-x" title="Delete" onClick={() => deleteTask(t.id)}>
                      ✕
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
