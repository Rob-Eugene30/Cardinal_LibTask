from __future__ import annotations

import io
import csv
from datetime import datetime, timezone, date
from collections import defaultdict

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

from app.db.supabase_http import sb_get
from app.core.errors import forbidden

REST = "/rest/v1"

# statuses
CANONICAL_STATUSES = ["assigned", "in_progress", "blocked", "completed", "cancelled"]
CLOSED_STATUSES = {"completed", "cancelled"}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _admin_jwt(actor: dict) -> str:
    if actor.get("app_role") != "admin":
        forbidden("Admin access required.")
    jwt = actor.get("access_token")
    if not jwt:
        forbidden("Missing access token.")
    return jwt


def _filters_block(start_date: date | None, end_date: date | None) -> dict:
    return {
        "start_date": start_date.isoformat() if start_date else None,
        "end_date": end_date.isoformat() if end_date else None,
    }


def _range_filter_params(start_date: date | None, end_date: date | None) -> dict:
    """
    PostgREST AND filter (inclusive) on tasks.created_at:
    and=(created_at.gte.YYYY-MM-DD,created_at.lte.YYYY-MM-DD)
    """
    if not start_date and not end_date:
        return {}

    parts: list[str] = []
    if start_date:
        parts.append(f"created_at.gte.{start_date.isoformat()}")
    if end_date:
        parts.append(f"created_at.lte.{end_date.isoformat()}")

    return {"and": f"({','.join(parts)})"}

# JSON REPORTS
def tasks_summary(actor: dict, start_date: date | None = None, end_date: date | None = None) -> dict:
    jwt = _admin_jwt(actor)

    params = {"select": "status"}
    params.update(_range_filter_params(start_date, end_date))

    rows = sb_get(f"{REST}/tasks", user_jwt=jwt, params=params)

    counts = defaultdict(int)

    # initialize statuses so table always has consistent keys
    for s in CANONICAL_STATUSES:
        counts[s] = 0

    for r in rows:
        status = (r.get("status") or "unknown").lower()
        counts[status] += 1

    by_status = [{"label": s, "count": counts[s]} for s in CANONICAL_STATUSES]

    # include unknown statuses at the end 
    for k in sorted(counts.keys()):
        if k not in CANONICAL_STATUSES:
            by_status.append({"label": k, "count": counts[k]})

    total_tasks = sum(x["count"] for x in by_status)
    closed_tasks = sum(x["count"] for x in by_status if x["label"] in CLOSED_STATUSES)
    open_tasks = total_tasks - closed_tasks

    return {
        "generated_at": _now_iso(),
        "filters": _filters_block(start_date, end_date),
        "total_tasks": total_tasks,
        "open_tasks": open_tasks,
        "closed_tasks": closed_tasks,
        "by_status": by_status,
    }


def staff_summary(actor: dict, start_date: date | None = None, end_date: date | None = None) -> dict:
    jwt = _admin_jwt(actor)

    params = {"select": "assigned_to,status"}
    params.update(_range_filter_params(start_date, end_date))

    tasks = sb_get(f"{REST}/tasks", user_jwt=jwt, params=params)

    by_staff = defaultdict(lambda: {"total_tasks": 0, "open_tasks": 0, "closed_tasks": 0})

    for t in tasks:
        staff_id = t.get("assigned_to")
        if not staff_id:
            # exclude unassigned from staff summary 
            continue

        stats = by_staff[staff_id]
        stats["total_tasks"] += 1

        status = (t.get("status") or "unknown").lower()
        if status in CLOSED_STATUSES:
            stats["closed_tasks"] += 1
        else:
            stats["open_tasks"] += 1

    items = [{"staff_id": sid, **stats} for sid, stats in by_staff.items()]
    items.sort(key=lambda x: x["total_tasks"], reverse=True)

    return {
        "generated_at": _now_iso(),
        "filters": _filters_block(start_date, end_date),
        "items": items,
    }


def tag_summary(actor: dict, start_date: date | None = None, end_date: date | None = None) -> dict:
    jwt = _admin_jwt(actor)

    # Filter tasks first 
    task_params = {"select": "id"}
    task_params.update(_range_filter_params(start_date, end_date))
    tasks = sb_get(f"{REST}/tasks", user_jwt=jwt, params=task_params)

    task_ids = [t["id"] for t in tasks if "id" in t]
    if not task_ids:
        return {
            "generated_at": _now_iso(),
            "filters": _filters_block(start_date, end_date),
            "items": [],
        }

    # Tag lookup
    tags = sb_get(f"{REST}/tags", user_jwt=jwt, params={"select": "id,name"})
    tag_name = {t["id"]: t["name"] for t in tags}

    # Count joins for those tasks only
    joins = sb_get(
        f"{REST}/task_tags",
        user_jwt=jwt,
        params={
            "select": "tag_id,task_id",
            "task_id": f"in.({','.join(map(str, task_ids))})",
        },
    )

    counts = defaultdict(int)
    for j in joins:
        tid = j.get("tag_id")
        label = tag_name.get(tid, str(tid))
        counts[label] += 1

    items = [{"tag": k, "total_tasks": v} for k, v in counts.items()]
    items.sort(key=lambda x: (-x["total_tasks"], x["tag"]))

    return {
        "generated_at": _now_iso(),
        "filters": _filters_block(start_date, end_date),
        "items": items,
    }

# CSV EXPORTS
def export_tasks_summary_csv(actor: dict, start_date: date | None = None, end_date: date | None = None) -> io.BytesIO:
    report = tasks_summary(actor, start_date=start_date, end_date=end_date)

    buf = io.StringIO()
    w = csv.writer(buf)

    w.writerow(["Report", "Tasks Summary"])
    w.writerow(["Generated At", report["generated_at"]])
    w.writerow(["Start Date", report["filters"]["start_date"]])
    w.writerow(["End Date", report["filters"]["end_date"]])
    w.writerow([])
    w.writerow(["total_tasks", report["total_tasks"]])
    w.writerow(["open_tasks", report["open_tasks"]])
    w.writerow(["closed_tasks", report["closed_tasks"]])
    w.writerow([])
    w.writerow(["status", "count"])
    for row in report["by_status"]:
        w.writerow([row["label"], row["count"]])

    out = io.BytesIO(buf.getvalue().encode("utf-8-sig"))
    out.seek(0)
    return out


def export_staff_summary_csv(actor: dict, start_date: date | None = None, end_date: date | None = None) -> io.BytesIO:
    report = staff_summary(actor, start_date=start_date, end_date=end_date)

    buf = io.StringIO()
    w = csv.writer(buf)

    w.writerow(["Report", "Staff Summary"])
    w.writerow(["Generated At", report["generated_at"]])
    w.writerow(["Start Date", report["filters"]["start_date"]])
    w.writerow(["End Date", report["filters"]["end_date"]])
    w.writerow([])
    w.writerow(["staff_id", "total_tasks", "open_tasks", "closed_tasks"])

    for row in report["items"]:
        w.writerow([row["staff_id"], row["total_tasks"], row["open_tasks"], row["closed_tasks"]])

    out = io.BytesIO(buf.getvalue().encode("utf-8-sig"))
    out.seek(0)
    return out


def export_tag_summary_csv(actor: dict, start_date: date | None = None, end_date: date | None = None) -> io.BytesIO:
    report = tag_summary(actor, start_date=start_date, end_date=end_date)

    buf = io.StringIO()
    w = csv.writer(buf)

    w.writerow(["Report", "Tag Summary"])
    w.writerow(["Generated At", report["generated_at"]])
    w.writerow(["Start Date", report["filters"]["start_date"]])
    w.writerow(["End Date", report["filters"]["end_date"]])
    w.writerow([])
    w.writerow(["tag", "total_tasks"])

    for row in report["items"]:
        w.writerow([row["tag"], row["total_tasks"]])

    out = io.BytesIO(buf.getvalue().encode("utf-8-sig"))
    out.seek(0)
    return out


# PDF EXPORTS
def _pdf_header(c: canvas.Canvas, title: str, generated_at: str, start_date: str | None, end_date: str | None):
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1 * inch, 10.5 * inch, title)

    c.setFont("Helvetica", 10)
    c.drawString(1 * inch, 10.2 * inch, f"Generated at: {generated_at}")
    c.drawString(1 * inch, 10.0 * inch, f"Start date: {start_date or '-'}")
    c.drawString(4.5 * inch, 10.0 * inch, f"End date: {end_date or '-'}")


def export_tasks_summary_pdf(actor: dict, start_date: date | None = None, end_date: date | None = None) -> io.BytesIO:
    report = tasks_summary(actor, start_date=start_date, end_date=end_date)

    out = io.BytesIO()
    c = canvas.Canvas(out, pagesize=letter)

    _pdf_header(c, "Tasks Summary Report", report["generated_at"], report["filters"]["start_date"], report["filters"]["end_date"])

    y = 9.5 * inch
    c.setFont("Helvetica-Bold", 11)
    c.drawString(1 * inch, y, "Totals")
    y -= 0.25 * inch

    c.setFont("Helvetica", 10)
    c.drawString(1 * inch, y, f"Total tasks: {report['total_tasks']}")
    y -= 0.2 * inch
    c.drawString(1 * inch, y, f"Open tasks: {report['open_tasks']}")
    y -= 0.2 * inch
    c.drawString(1 * inch, y, f"Closed tasks: {report['closed_tasks']}")
    y -= 0.35 * inch

    c.setFont("Helvetica-Bold", 11)
    c.drawString(1 * inch, y, "By Status")
    y -= 0.25 * inch

    c.setFont("Helvetica-Bold", 10)
    c.drawString(1 * inch, y, "Status")
    c.drawString(4 * inch, y, "Count")
    y -= 0.18 * inch

    c.setFont("Helvetica", 10)
    for row in report["by_status"]:
        if y < 1 * inch:
            c.showPage()
            y = 10.5 * inch
        c.drawString(1 * inch, y, str(row["label"]))
        c.drawString(4 * inch, y, str(row["count"]))
        y -= 0.18 * inch

    c.showPage()
    c.save()
    out.seek(0)
    return out


def export_staff_summary_pdf(actor: dict, start_date: date | None = None, end_date: date | None = None) -> io.BytesIO:
    report = staff_summary(actor, start_date=start_date, end_date=end_date)

    out = io.BytesIO()
    c = canvas.Canvas(out, pagesize=letter)

    _pdf_header(c, "Staff Summary Report", report["generated_at"], report["filters"]["start_date"], report["filters"]["end_date"])

    y = 9.5 * inch
    c.setFont("Helvetica-Bold", 10)
    c.drawString(1 * inch, y, "Staff ID")
    c.drawString(3.8 * inch, y, "Total")
    c.drawString(4.8 * inch, y, "Open")
    c.drawString(5.8 * inch, y, "Closed")
    y -= 0.2 * inch

    c.setFont("Helvetica", 9)
    for row in report["items"]:
        if y < 1 * inch:
            c.showPage()
            y = 10.5 * inch
        c.drawString(1 * inch, y, str(row["staff_id"]))
        c.drawString(3.8 * inch, y, str(row["total_tasks"]))
        c.drawString(4.8 * inch, y, str(row["open_tasks"]))
        c.drawString(5.8 * inch, y, str(row["closed_tasks"]))
        y -= 0.18 * inch

    c.showPage()
    c.save()
    out.seek(0)
    return out


def export_tag_summary_pdf(actor: dict, start_date: date | None = None, end_date: date | None = None) -> io.BytesIO:
    report = tag_summary(actor, start_date=start_date, end_date=end_date)

    out = io.BytesIO()
    c = canvas.Canvas(out, pagesize=letter)

    _pdf_header(c, "Tag Summary Report", report["generated_at"], report["filters"]["start_date"], report["filters"]["end_date"])

    y = 9.5 * inch
    c.setFont("Helvetica-Bold", 10)
    c.drawString(1 * inch, y, "Tag")
    c.drawString(5.2 * inch, y, "Total Tasks")
    y -= 0.2 * inch

    c.setFont("Helvetica", 9)
    for row in report["items"]:
        if y < 1 * inch:
            c.showPage()
            y = 10.5 * inch
        c.drawString(1 * inch, y, str(row["tag"]))
        c.drawString(5.2 * inch, y, str(row["total_tasks"]))
        y -= 0.18 * inch

    c.showPage()
    c.save()
    out.seek(0)
    return out
