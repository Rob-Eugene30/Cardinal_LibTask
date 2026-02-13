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
    <div style={{ padding: 16 }}>
      <h2>Tasks</h2>
      <button onClick={load} disabled={loading}>
        {loading ? "Loading..." : "Refresh"}
      </button>

      {err && <div style={{ marginTop: 12, color: "crimson" }}>{err}</div>}

      <table cellPadding={8} style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <thead>
          <tr>
            <th align="left">Title</th>
            <th align="left">Assigned To</th>
            <th align="left">Due</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id} style={{ borderTop: "1px solid #ddd" }}>
              <td>{t.title}</td>
              <td>{t.assigned_to}</td>
              <td>{t.due_date ?? "—"}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 12 }}>
                {loading ? "Loading…" : "No tasks."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
