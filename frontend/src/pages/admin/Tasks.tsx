import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Task = {
  id: string;
  title: string;
  dueISO: string; // e.g. "2026-02-03T21:00:00+08:00"
  timezoneLabel: string; // "(UTC+8)"
  course: string;
  color: "green" | "blue" | "purple";
  status: "Open" | "In Progress" | "Done";
};

const STORAGE_KEY = "clibtask_admin_tasks_v1";

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
  // simple local formatting (placeholder)
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const yy = String(d.getFullYear()).slice(-2);

  let hrs = d.getHours();
  const mins = pad2(d.getMinutes());
  const ampm = hrs >= 12 ? "PM" : "AM";
  hrs = hrs % 12;
  if (hrs === 0) hrs = 12;

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
      dueISO: "2026-02-02T23:59:00+08:00",
      timezoneLabel: "(UTC+8)",
      course: "(Placeholder Course / Context)",
      color: "blue",
      status: "Open",
    },
    {
      id: "TASK-003",
      title: "(Placeholder Task Title)",
      dueISO: "2026-02-03T21:00:00+08:00",
      timezoneLabel: "(UTC+8)",
      course: "(Placeholder Course / Context)",
      color: "purple",
      status: "In Progress",
    },
  ];
}

export default function Tasks() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | Task["status"]>("All");

  // "Add task" form state (all placeholders)
  const [title, setTitle] = useState("(Placeholder Task Title)");
  const [course, setCourse] = useState("(Placeholder Course / Context)");
  const [dueISO, setDueISO] = useState("2026-02-06T23:59:00+08:00");
  const [color, setColor] = useState<Task["color"]>("green");
  const [status, setStatus] = useState<Task["status"]>("Open");

  // Load from localStorage once
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Task[];
        if (Array.isArray(parsed) && parsed.length) {
          setTasks(parsed);
          return;
        }
      } catch {
        // ignore parse errors and fall back
      }
    }
    setTasks(defaultPlaceholderTasks());
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return tasks
      .filter((t) => (statusFilter === "All" ? true : t.status === statusFilter))
      .filter((t) => {
        if (!q) return true;
        return (
          t.id.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.course.toLowerCase().includes(q)
        );
      })
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
    return Array.from(map.entries()).map(([key, items]) => {
      const d = new Date(items[0].dueISO);
      return { key, label: formatDayLabel(d), items };
    });
  }, [filtered]);

  function nextId(): string {
    // simple incremental TASK-### based on current max
    let max = 0;
    for (const t of tasks) {
      const n = Number(t.id.replace("TASK-", ""));
      if (!Number.isNaN(n)) max = Math.max(max, n);
    }
    return `TASK-${pad2(max + 1).padStart(3, "0")}`;
  }

  function addTask() {
    const newTask: Task = {
      id: nextId(),
      title: title.trim() || "(Placeholder Task Title)",
      dueISO: dueISO.trim() || "2026-02-06T23:59:00+08:00",
      timezoneLabel: "(UTC+8)",
      course: course.trim() || "(Placeholder Course / Context)",
      color,
      status,
    };
    setTasks((prev) => [newTask, ...prev]);
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function resetToPlaceholders() {
    setTasks(defaultPlaceholderTasks());
  }

  return (
    <div className="tasks-page">
      <div className="tasks-top">
        <button className="back-btn" onClick={() => navigate("/admin/dashboard")}>
          ← Back
        </button>

        <div className="tasks-head">
          <h2 className="tasks-title">Tasks</h2>
          <p className="tasks-sub">Dynamic placeholder tasks (stored locally)</p>
        </div>
      </div>

      {/* Controls */}
      <div className="tasks-controls">
        <div className="tasks-search">
          <span className="search-ico">🔎</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID / title / course"
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

        <button className="ghost-btn" onClick={resetToPlaceholders}>
          Reset placeholders
        </button>
      </div>

      {/* List */}
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
                    <div className="due-icon" aria-hidden="true">
                      ☑
                    </div>

                    <div className="due-main">
                      <div className="due-title">{t.title}</div>
                      <div className="due-meta">
                        <span className="due-text">{formatDueText(d, t.timezoneLabel)}</span>
                        <span className="dot">•</span>
                        <span className="due-link">{t.course}</span>
                        <span className="dot">•</span>
                        <span className="pill">{t.status}</span>
                        <span className="dot">•</span>
                        <span className="id">{t.id}</span>
                      </div>
                    </div>

                    <button className="card-x" onClick={() => deleteTask(t.id)} title="Delete">
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
