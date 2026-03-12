import type { StatusUpdate } from "../../api/status";
import { formatDateTime, safeLabel } from "../../lib/format";
import { getTaskStatusLabel } from "../../types/task";

export default function StatusHistory({ items }: { items: StatusUpdate[] }) {
  if (!items.length) {
    return <div className="adm-muted">No status history yet.</div>;
  }

  return (
    <div className="adm-tablewrap">
      <table className="adm-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Status</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id ?? `${item.task_id}-${item.created_at ?? index}`}>
              <td>{formatDateTime(item.created_at)}</td>
              <td>{getTaskStatusLabel(item.status)}</td>
              <td>{safeLabel(item.note, "—")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
