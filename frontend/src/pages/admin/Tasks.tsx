import { useEffect, useState } from "react";
import { listTasks } from "../../api/tasks";
import type { Task } from "../../api/tasks";

export default function Tasks() {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await listTasks();
      setItems(res.items || []);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="content">


      {/* TOOLBAR */}
      <div className="toolbar">
        <span className="muted">
          {items.length} {items.length === 1 ? "task" : "tasks"}
        </span>

        <div className="toolbar-right">
          <button className="ghost-btn" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {err && (
        <div style={{ marginBottom: 12, color: "crimson", fontWeight: 700 }}>
          {err}
        </div>
      )}

      {/* TABLE CARD */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <p className="muted">Loading tasks...</p>
          ) : items.length === 0 ? (
            <p className="muted">No tasks available.</p>
          ) : (
            <table className="task-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Assigned To</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{t.assigned_to}</td>
                    <td>{t.due_date ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
