from datetime import date
from app.db.client import fetch_all

def report_by_staff(start_date: date | None, end_date: date | None) -> list[dict]:
    where = []
    params = {}
    if start_date:
        where.append("t.created_at::date >= :start_date")
        params["start_date"] = start_date
    if end_date:
        where.append("t.created_at::date <= :end_date")
        params["end_date"] = end_date

    where_sql = ("where " + " and ".join(where)) if where else ""

    return fetch_all(
        f"""
        select
          t.assigned_to as staff_id,
          count(*)::int as total_tasks,
          sum(case when su.latest_status in ('done','cancelled') then 0 else 1 end)::int as open_tasks,
          sum(case when su.latest_status in ('done','cancelled') then 1 else 0 end)::int as closed_tasks
        from tasks t
        left join (
          select task_id, (array_agg(status order by created_at desc))[1] as latest_status
          from status_updates
          group by task_id
        ) su on su.task_id = t.id
        {where_sql}
        group by t.assigned_to
        order by total_tasks desc
        """,
        params,
    )

def report_by_tag(start_date: date | None, end_date: date | None) -> list[dict]:
    where = []
    params = {}
    if start_date:
        where.append("t.created_at::date >= :start_date")
        params["start_date"] = start_date
    if end_date:
        where.append("t.created_at::date <= :end_date")
        params["end_date"] = end_date

    where_sql = ("where " + " and ".join(where)) if where else ""

    return fetch_all(
        f"""
        select
          g.name as tag,
          count(*)::int as total_tasks
        from task_tags tt
        join tasks t on t.id = tt.task_id
        join tags g on g.id = tt.tag_id
        {where_sql}
        group by g.name
        order by total_tasks desc, g.name asc
        """,
        params,
    )
