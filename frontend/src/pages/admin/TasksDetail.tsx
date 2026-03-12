import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { listStatusUpdates, type StatusUpdate } from "../../api/status";
import { getStaff } from "../../api/staff";
import { getTask, type Task } from "../../api/tasks";
import StatusHistory from "../../components/tasks/StatusHistory";
import { formatDate } from "../../lib/format";
import { getTaskStatusLabel } from "../../types/task";

export default function AdminTaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [history, setHistory] = useState<StatusUpdate[]>([]);
  const [assigneeName, setAssigneeName] = useState<string>("—");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      setLoading(false);
      return;
    }

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [taskRes, historyRes, staffRes] = await Promise.all([getTask(taskId), listStatusUpdates(taskId), getStaff()]);
        if (!alive) return;

        setTask(taskRes);
        setHistory(historyRes.items ?? []);
        const match = staffRes.find((member) => member.id === taskRes.assigned_to);
        setAssigneeName((match?.full_name ?? "").trim() || match?.staff_code || taskRes.assigned_to);
      } catch (err) {
        if (!alive) return;
        setError((err as Error)?.message ?? "Failed to load task details.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [taskId]);

  return (
    <div className="adm-page">
      <button className="adm-link" onClick={() => navigate("/admin/tasks")} type="button">
        ← Back to Tasks
      </button>

      {loading && <div className="adm-card adm-pad">Loading task details...</div>}
      {error && <div className="adm-form-error">{error}</div>}

      {!loading && task && (
        <>
          <div className="adm-card adm-section">
            <h2 className="adm-h2">Task Detail</h2>
            <div className="adm-grid2">
              <div>
                <div className="adm-label">Title</div>
                <div className="adm-value">{task.title}</div>

                <div style={{ height: 14 }} />

                <div className="adm-label">Description</div>
                <div className="adm-value">{task.description || "—"}</div>
              </div>

              <div>
                <div className="adm-label">Assigned To</div>
                <div className="adm-value">{assigneeName}</div>

                <div style={{ height: 14 }} />

                <div className="adm-label">Status</div>
                <div className="adm-value">{getTaskStatusLabel(task.status)}</div>

                <div style={{ height: 14 }} />

                <div className="adm-label">Due Date</div>
                <div className="adm-value">{formatDate(task.due_date)}</div>
              </div>
            </div>
          </div>

          <div className="adm-card adm-section">
            <h2 className="adm-h2">Status History</h2>
            <StatusHistory items={history} />
          </div>
        </>
      )}
    </div>
  );
}
