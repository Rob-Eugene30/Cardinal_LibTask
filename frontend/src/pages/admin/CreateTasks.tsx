import { useEffect, useMemo, useState } from "react";
import { createTask } from "../../api/tasks";
import { getStaff, type StaffProfile } from "../../api/staff";
import "../../components/layout/AdminLayout.css";

type Priority = "Low" | "Medium" | "High";

export default function AdminCreateTasks() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDateTime, setDueDateTime] = useState("");
  const [priority, setPriority] = useState<Priority>("High");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setStaffLoading(true);
        const rows = await getStaff();
        if (!alive) return;

        setStaffList(rows.filter((u) => u.role === "staff"));
      } catch {
        if (!alive) return;
        setStaffList([]);
      } finally {
        if (!alive) return;
        setStaffLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const assigneeName = useMemo(() => {
    const found = staffList.find((s) => s.id === assignedTo);
    return (
      (found?.full_name && found.full_name.trim()) ||
      (found ? `User ${found.id.slice(0, 6)}…` : "")
    );
  }, [assignedTo, staffList]);

  function normalizeDueDate(input: string) {
    return input ? input : null;
  }

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
        due_date: normalizeDueDate(dueDateTime),
      });

      setOk("Task created successfully.");
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDueDateTime("");
      setPriority("High");
    } catch (ex: any) {
      setErr(ex?.message ?? String(ex));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="adm-create-overlay">
      <div className="adm-create-card">
        <div className="adm-create-header">
          <div>
            <h2>Create New Task</h2>
            <p>Define a new step in your workflow by creating a task.</p>
          </div>

          <button
            type="button"
            className="adm-create-close"
            onClick={() => window.history.back()}
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {/* Title */}
          <div className="adm-form-group">
            <label>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              required
            />
          </div>

          {/* Priority + Due Date */}
          <div className="adm-form-grid">
            <div className="adm-form-group">
              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="adm-form-group">
              <label>Due Date & Time</label>
              <input
                type="datetime-local"
                value={dueDateTime}
                onChange={(e) => setDueDateTime(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="adm-form-group">
            <label>Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task..."
            />
          </div>

          {/* Assignee Dropdown */}
          <div className="adm-form-group">
            <label>Assignee</label>

            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              disabled={staffLoading}
              required
            >
              <option value="">
                {staffLoading ? "Loading staff..." : "Select a staff member"}
              </option>

              {!staffLoading &&
                staffList.map((s) => {
                  const name =
                    (s.full_name && s.full_name.trim()) ||
                    `User ${s.id.slice(0, 6)}…`;

                  return (
                    <option key={s.id} value={s.id}>
                      {name}
                    </option>
                  );
                })}
            </select>

            {assignedTo && (
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
                Selected: <b>{assigneeName}</b>
              </div>
            )}
          </div>

          {err && <div className="adm-form-error">{err}</div>}
          {ok && <div className="adm-form-success">{ok}</div>}

          <div className="adm-create-footer">
            <button
              type="button"
              className="adm-btn-cancel"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="adm-btn-primary"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}