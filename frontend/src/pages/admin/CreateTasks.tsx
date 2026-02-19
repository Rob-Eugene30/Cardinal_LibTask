import { useState } from "react";
import { createTask } from "../../api/tasks";

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

      setOk("Task created successfully.");
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
    <div className="content">

      {/* CENTER WRAPPER */}
      <div className="create-wrapper">
        <div className="adm-form-card create-card">
          <h2 className="adm-form-title">Create Task</h2>

          <form onSubmit={onSubmit} className="adm-form">

            <div className="adm-form-group">
              <label>Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="adm-form-group">
              <label>Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="adm-form-group">
              <label>Assign To (User UUID)</label>
              <input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                required
              />
            </div>

            <div className="adm-form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {err && <div className="adm-form-error">{err}</div>}
            {ok && <div className="adm-form-success">{ok}</div>}

            <button
              type="submit"
              className="adm-btn-primary"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Task"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
