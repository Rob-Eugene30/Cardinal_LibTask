import { apiGet } from "./http";

type ReportQuery = {
  start_date?: string;
  end_date?: string;
  staff_id?: string;
};

function qs(q?: ReportQuery) {
  if (!q) return "";
  const params = new URLSearchParams();
  if (q.start_date) params.set("start_date", q.start_date);
  if (q.end_date) params.set("end_date", q.end_date);
  if (q.staff_id) params.set("staff_id", q.staff_id);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export function getTasksSummary(q?: ReportQuery) {
  return apiGet(`/reports/tasks-summary${qs(q)}`);
}

export function getStaffSummary(q?: ReportQuery) {
  return apiGet(`/reports/staff-summary${qs(q)}`);
}

export function getTagSummary(q?: ReportQuery) {
  return apiGet(`/reports/tag-summary${qs(q)}`);
}
