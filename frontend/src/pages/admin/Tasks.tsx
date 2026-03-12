import { useEffect, useMemo, useState } from "react";

import { getStaff } from "../../api/staff";
import { listTasks, type Task } from "../../api/tasks";
import TaskCards from "../../components/tasks/TaskCards";
import TaskFilters from "../../components/tasks/TaskFilters";
import { normalizeTaskStatus, type TaskStatusCode } from "../../types/task";
import "../../components/layout/AdminLayout.css";

export default function AdminTasks() {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | TaskStatusCode>("All");
  const [search, setSearch] = useState("");
  const [assigneeNameById, setAssigneeNameById] = useState<Map<string, string>>(new Map());

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [taskRes, staffRes] = await Promise.all([listTasks(), getStaff()]);
      setItems(taskRes.items ?? []);
      setAssigneeNameById(
        new Map(staffRes.map((member) => [member.id, (member.full_name ?? "").trim() || member.staff_code || member.id])),
      );
    } catch (err) {
      setError((err as Error)?.message ?? "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const tasksForUI = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((task) => {
      const matchesFilter = filter === "All" ? true : normalizeTaskStatus(task.status) === filter;
      const haystack = `${task.title} ${task.description ?? ""}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [filter, items, search]);

  return (
    <div className="adm-content">
      <div className="adm-tasks-header">
        <div>
          <h1 className="adm-tasks-title">All Tasks</h1>
          <p className="adm-tasks-sub">View and track all tasks assigned in the system.</p>
        </div>

        <div className="adm-tasks-actions">
          <TaskFilters filter={filter} onFilterChange={setFilter} search={search} onSearchChange={setSearch} />

          <button className="adm-btn-primary" onClick={() => void load()} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="adm-form-error">{error}</div>}

      {loading ? <p style={{ opacity: 0.7, fontWeight: 600 }}>Loading tasks...</p> : <TaskCards items={tasksForUI} assigneeNameById={assigneeNameById} />}
    </div>
  );
}
