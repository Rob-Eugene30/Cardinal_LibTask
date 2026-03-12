import { Link } from "react-router-dom";

import type { Task } from "../../api/tasks";
import { formatDate, safeLabel } from "../../lib/format";
import StatusBadge from "./StatusBadge";

export default function TaskCards({
  items,
  assigneeNameById,
}: {
  items: Task[];
  assigneeNameById?: Map<string, string>;
}) {
  if (!items.length) {
    return (
      <div className="adm-empty-card">
        <div className="adm-empty-title">No tasks found</div>
        <div className="adm-empty-sub">Try changing the filter or refresh.</div>
      </div>
    );
  }

  return (
    <div className="adm-task-grid">
      {items.map((task) => (
        <Link key={task.id} to={`/admin/tasks/${encodeURIComponent(task.id)}`} className="adm-task-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="adm-task-top">
            <div className="adm-task-code">TASK-{String(task.id).slice(0, 6).toUpperCase()}</div>
            <StatusBadge status={task.status} />
          </div>

          <div className="adm-task-name">{task.title}</div>

          <div className="adm-task-row">
            <span className="adm-task-label">Due</span>
            <span className="adm-task-value">{formatDate(task.due_date)}</span>
          </div>

          <div className="adm-task-row">
            <span className="adm-task-label">Assigned To</span>
            <span className="adm-task-value">{safeLabel(assigneeNameById?.get(task.assigned_to) ?? task.assigned_to)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
