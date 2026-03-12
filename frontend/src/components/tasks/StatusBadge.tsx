import { getTaskStatusClass, getTaskStatusLabel } from "../../types/task";

export default function StatusBadge({ status }: { status?: string | null }) {
  return <span className={`adm-status ${getTaskStatusClass(status)}`}>{getTaskStatusLabel(status)}</span>;
}
