export type ReportsFilters = {
  start_date: string | null;
  end_date: string | null;
};

export type TasksSummaryStatusRow = { label: string; count: number };

export type TasksSummaryResponse = {
  generated_at: string;
  filters: ReportsFilters;
  total_tasks: number;
  open_tasks: number;
  closed_tasks: number;
  by_status: TasksSummaryStatusRow[];
};

export type StaffSummaryRow = {
  staff_id: string;
  total_tasks: number;
  open_tasks: number;
  closed_tasks: number;
};

export type StaffSummaryResponse = {
  generated_at: string;
  filters: ReportsFilters;
  items: StaffSummaryRow[];
};

export type TagSummaryRow = {
  tag: string;
  total_tasks: number;
};

export type TagSummaryResponse = {
  generated_at: string;
  filters: ReportsFilters;
  items: TagSummaryRow[];
};
