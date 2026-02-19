import { useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  dueISO: string;
  course: string;
  status: string;
};

const STORAGE_KEY = "clibtask_admin_tasks_v1";

export default function StaffDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setTasks(JSON.parse(stored));
    }
  }, []);

  const total = tasks.length;
  const open = tasks.filter(t => t.status === "Open").length;
  const done = tasks.filter(t => t.status === "Done").length;

  return (
    <div className="adm-content">
      <h2 style={{ fontWeight: 800, marginBottom: 24 }}>
        Staff Dashboard
      </h2>

      <div className="adm-grid">
        <div className="adm-card">
          <div className="adm-card__title">{total}</div>
          <div className="adm-card__sub">Total Tasks</div>
        </div>

        <div className="adm-card">
          <div className="adm-card__title">{open}</div>
          <div className="adm-card__sub">Open Tasks</div>
        </div>

        <div className="adm-card">
          <div className="adm-card__title">{done}</div>
          <div className="adm-card__sub">Completed Tasks</div>
        </div>
      </div>
    </div>
  );
}
