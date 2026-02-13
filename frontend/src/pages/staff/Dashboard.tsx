import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listTasks } from "../../api/tasks";
import type { Task } from "../../api/tasks";
import { logout } from "../../lib/auth";

export default function Dashboard() {
  const navigate = useNavigate();

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
      const msg = e?.message ?? String(e);
      setErr(msg);

      // If token is invalid/expired or missing, go back to login
      if (e?.status === 401) {
        logout();
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>My Tasks</h2>

        <button onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>

        <button
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        >
          Logout
        </button>
      </div>

      {err && <div style={{ marginTop: 12, color: "crimson" }}>{err}</div>}

      <table
        cellPadding={8}
        style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}
      >
        <thead>
          <tr>
            <th align="left">Title</th>
            <th align="left">Due</th>
            <th align="left">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id} style={{ borderTop: "1px solid #ddd" }}>
              <td>{t.title}</td>
              <td>{t.due_date ?? "—"}</td>
              <td>{t.status ?? "—"}</td>
            </tr>
          ))}

          {items.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 12 }}>
                {loading ? "Loading…" : "No tasks assigned."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
