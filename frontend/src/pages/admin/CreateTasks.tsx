import { useEffect, useState } from "react";
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

function nextId(tasks: Task[]) {
  let max = 0;
  for (const t of tasks) {
    const n = Number(String(t.id).replace("TASK-", ""));
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return `TASK-${String(max + 1).padStart(3, "0")}`;
}

export default function CreateTasks() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);

  // form state (placeholders)
  const [title, setTitle] = useState("(Placeholder Task Title)");
  const [course, setCourse] = useState("(Placeholder Course / Context)");
  const [dueISO, setDueISO] = useState("2026-02-06T23:59:00+08:00");
  const [status, setStatus] = useState<Task["status"]>("Open");
  const [color, setColor] = useState<Task["color"]>("green");

  // tiny feedback message
  const [savedMsg, setSavedMsg] = useState("");

  // load existing tasks
  useEffect(() => {
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
  }, []);

function addTask() {
  const safeTitle = title.trim() || "(Placeholder Task Title)";
  const safeCourse = course.trim() || "(Placeholder Course / Context)";
  const safeDue = dueISO.trim() || "2026-02-06T23:59:00+08:00";

  const newTask: Task = {
    id: nextId(tasks),
    title: safeTitle,
    course: safeCourse,
    dueISO: safeDue,
    timezoneLabel: "(UTC+8)",
    color,
    status,
  };

  const updated = [newTask, ...tasks];

  // update state + persist
  setTasks(updated);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // ✅ notify other pages in THIS TAB to refresh
  window.dispatchEvent(new Event("clibtask_tasks_updated"));

  // reset fields
  setTitle("(Placeholder Task Title)");
  setCourse("(Placeholder Course / Context)");
  setDueISO("2026-02-06T23:59:00+08:00");
  setStatus("Open");
  setColor("green");

  // feedback
  setSavedMsg(`Saved ${newTask.id}`);
  window.setTimeout(() => setSavedMsg(""), 1500);
}

  return (
    <div className="tasks-page">
      <div className="tasks-top">
        <button className="back-btn" onClick={() => navigate("/admin/dashboard")}>
          ← Back
        </button>

        <div className="tasks-head">
          <h2 className="tasks-title">Create Task</h2>
          <p className="tasks-sub">Add a new task (placeholder form)</p>
        </div>
      </div>

      {/* FORM PANEL */}
      <div className="add-panel">
        <div className="add-grid">
          <div>
            <div className="field-label">Title</div>
            <input
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <div className="field-label">Course / Context</div>
            <input
              className="field"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
          </div>

          <div>
            <div className="field-label">Due (ISO-ish)</div>
            <input
              className="field"
              value={dueISO}
              onChange={(e) => setDueISO(e.target.value)}
            />
            <div className="hint">Example: 2026-02-06T23:59:00+08:00</div>
          </div>

          <div>
            <div className="field-label">Status</div>
            <select
              className="field"
              value={status}
              onChange={(e) => setStatus(e.target.value as Task["status"])}
            >
              <option>Open</option>
              <option>In Progress</option>
              <option>Done</option>
            </select>
          </div>

          <div>
            <div className="field-label">Color</div>
            <select
              className="field"
              value={color}
              onChange={(e) => setColor(e.target.value as Task["color"])}
            >
              <option value="green">Green</option>
              <option value="blue">Blue</option>
              <option value="purple">Purple</option>
            </select>
          </div>

          <div className="add-actions">
            <button className="primary-btn" type="button" onClick={addTask}>
              + Add
            </button>
          </div>
        </div>

        {/* optional feedback */}
        {savedMsg ? (
          <div style={{ marginTop: 10, fontWeight: 800, color: "#b31218" }}>
            {savedMsg}
          </div>
        ) : null}
      </div>
    </div>
  );
}
