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
    <div className="adm-content">

      {/* ================= TOOLBAR ================= */}
      <div className="toolbar" style={{ marginBottom: 24 }}>
        <span className="muted" style={{ fontWeight: 700 }}>
          {items.length} {items.length === 1 ? "task" : "tasks"}
        </span>

        <div style={{ marginLeft: "auto" }}>
          <button
            className="adm-btn-primary"
            onClick={load}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ================= ERROR ================= */}
      {err && (
        <div style={{ marginBottom: 16, color: "crimson", fontWeight: 600 }}>
          {err}
        </div>
      )}

      {/* ================= CONTENT ================= */}
      {loading ? (
        <p className="muted">Loading tasks...</p>
      ) : items.length === 0 ? (
        <div className="adm-card">
          <div className="adm-card__sub">
            No tasks available.
          </div>
        </div>
      ) : (
        <div className="adm-task-grid">
          {items.map((t) => (
            <div key={t.id} className="adm-task-tile">

              {/* Image */}
              <div
                className="adm-task-image"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800')",
                }}
              />

              {/* Body */}
              <div className="adm-task-body">

                <div className="adm-task-title">
                  {t.title}
                </div>

                <div className="adm-task-meta">
                  Assigned To: {t.assigned_to ?? "—"}
                </div>

                <div className="adm-task-meta">
                  Due Date: {t.due_date ?? "—"}
                </div>

                <div className="adm-task-actions">
                  <button className="adm-task-btn">
                    View
                  </button>

                  <button className="adm-task-btn">
                    Edit
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
