import { TASK_STATUS_FILTER_OPTIONS, type TaskStatusCode } from "../../types/task";

export default function TaskFilters({
  filter,
  onFilterChange,
  search,
  onSearchChange,
}: {
  filter: "All" | TaskStatusCode;
  onFilterChange: (value: "All" | TaskStatusCode) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <>
      <input
        className="adm-select"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by title or description..."
      />

      <select className="adm-select" value={filter} onChange={(event) => onFilterChange(event.target.value as "All" | TaskStatusCode)}>
        {TASK_STATUS_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  );
}
