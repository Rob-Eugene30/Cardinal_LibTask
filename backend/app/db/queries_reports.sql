-- Reference queries for reports (canonical logic)

-- Date filtering is inclusive, applied to tasks.created_at

-- TASKS SUMMARY: counts by status
SELECT status, COUNT(*) AS count
FROM tasks
WHERE (:start_date IS NULL OR created_at::date >= :start_date)
  AND (:end_date IS NULL OR created_at::date <= :end_date)
GROUP BY status
ORDER BY status;

-- STAFF SUMMARY: open vs closed (closed = completed,cancelled)
SELECT
  assigned_to AS staff_id,
  COUNT(*) AS total_tasks,
  SUM(CASE WHEN status IN ('completed','cancelled') THEN 1 ELSE 0 END) AS closed_tasks,
  SUM(CASE WHEN status IN ('completed','cancelled') THEN 0 ELSE 1 END) AS open_tasks
FROM tasks
WHERE assigned_to IS NOT NULL
  AND (:start_date IS NULL OR created_at::date >= :start_date)
  AND (:end_date IS NULL OR created_at::date <= :end_date)
GROUP BY assigned_to
ORDER BY total_tasks DESC;

-- TAG SUMMARY: count tasks per tag (date filter applies to tasks)
SELECT
  tg.name AS tag,
  COUNT(*) AS total_tasks
FROM tasks t
JOIN task_tags tt ON tt.task_id = t.id
JOIN tags tg ON tg.id = tt.tag_id
WHERE (:start_date IS NULL OR t.created_at::date >= :start_date)
  AND (:end_date IS NULL OR t.created_at::date <= :end_date)
GROUP BY tg.name
ORDER BY total_tasks DESC, tg.name;
