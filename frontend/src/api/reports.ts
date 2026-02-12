import { apiGet } from "./http";

type ReportQuery = {
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
};

function qs(q?: ReportQuery) {
  if (!q) return "";
  const p = new URLSearchParams();
  if (q.start_date) p.set("start_date", q.start_date);
  if (q.end_date) p.set("end_date", q.end_date);
  const s = p.toString();
  return s ? `?${s}` : "";
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
