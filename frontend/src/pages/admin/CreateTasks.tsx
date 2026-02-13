import { useState } from "react";
import { createTask } from "../../api/tasks";
import { logout } from "../../lib/auth";

export default function AdminCreateTasks() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setLoading(true);

    try {
      await createTask({
        title,
        description: description || null,
        assigned_to: assignedTo,
        due_date: dueDate || null,
      });
      setOk("Task created.");
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDueDate("");
    } catch (ex: any) {
      setErr(ex?.message ?? String(ex));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 640 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Create Task</h2>
        <button
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Assign To (user uuid)</label>
          <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Due Date</label>
          <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" />
        </div>

        {err && <div style={{ color: "crimson" }}>{err}</div>}
        {ok && <div style={{ color: "green" }}>{ok}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </button>
      </form>
    </div>
  );
}
