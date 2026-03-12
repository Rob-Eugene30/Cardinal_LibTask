from __future__ import annotations

import csv
import io
from collections import defaultdict
from datetime import date, datetime, timezone

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

from app.core.errors import forbidden
from app.db.supabase_http import sb_get

REST = "/rest/v1"

CANONICAL_STATUSES = ["pending", "in_progress", "done", "on_hold", "cancelled"]
DISPLAY_STATUS = {
    "pending": "Not Yet Started",
    "in_progress": "In Progress",
    "done": "Finished",
    "on_hold": "On Hold",
    "cancelled": "Abolished",
}
CLOSED_STATUSES = {"done", "cancelled"}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _admin_jwt(actor: dict) -> str:
    if actor.get("app_role") != "admin":
        forbidden("Admin access required.")
    jwt = actor.get("access_token")
    if not jwt:
        forbidden("Missing access token.")
    return jwt


def _filters_block(start_date: date | None, end_date: date | None, staff_id: str | None = None) -> dict:
    return {
        "start_date": start_date.isoformat() if start_date else None,
        "end_date": end_date.isoformat() if end_date else None,
        "staff_id": staff_id,
    }


def _range_filter_params(start_date: date | None, end_date: date | None) -> dict:
    if not start_date and not end_date:
        return {}

    parts: list[str] = []
    if start_date:
        parts.append(f"created_at.gte.{start_date.isoformat()}")
    if end_date:
        parts.append(f"created_at.lte.{end_date.isoformat()}")
    return {"and": f"({','.join(parts)})"}


def _task_params(start_date: date | None, end_date: date | None, staff_id: str | None = None, *, select: str) -> dict:
    params = {"select": select}
    params.update(_range_filter_params(start_date, end_date))
    if staff_id:
        params["assigned_to"] = f"eq.{staff_id}"
    return params


def tasks_summary(actor: dict, start_date: date | None = None, end_date: date | None = None, staff_id: str | None = None) -> dict:
    jwt = _admin_jwt(actor)
    rows = sb_get(
        f"{REST}/tasks",
        user_jwt=jwt,
        params=_task_params(start_date, end_date, staff_id, select="status"),
    )

    counts = defaultdict(int)
    for status in CANONICAL_STATUSES:
        counts[status] = 0

    for row in rows:
        status = (row.get("status") or "pending").strip().lower()
        counts[status] += 1

    by_status = [
        {"key": status, "label": DISPLAY_STATUS.get(status, status), "count": counts[status]}
        for status in CANONICAL_STATUSES
    ]

    total_tasks = sum(item["count"] for item in by_status)
    closed_tasks = sum(item["count"] for item in by_status if item["key"] in CLOSED_STATUSES)
    open_tasks = total_tasks - closed_tasks

    return {
        "generated_at": _now_iso(),
        "filters": _filters_block(start_date, end_date, staff_id),
        "total_tasks": total_tasks,
        "open_tasks": open_tasks,
        "closed_tasks": closed_tasks,
        "by_status": by_status,
    }


def staff_summary(actor: dict, start_date: date | None = None, end_date: date | None = None, staff_id: str | None = None) -> dict:
    jwt = _admin_jwt(actor)
    tasks = sb_get(
        f"{REST}/tasks",
        user_jwt=jwt,
        params=_task_params(start_date, end_date, staff_id, select="assigned_to,status"),
    )

    by_staff = defaultdict(lambda: {"total_tasks": 0, "open_tasks": 0, "closed_tasks": 0})

    for task in tasks:
        assigned_to = task.get("assigned_to")
        if not assigned_to:
            continue
        stats = by_staff[assigned_to]
        stats["total_tasks"] += 1

        status = (task.get("status") or "pending").strip().lower()
        if status in CLOSED_STATUSES:
            stats["closed_tasks"] += 1
        else:
            stats["open_tasks"] += 1

    items = [{"staff_id": staff_key, **stats} for staff_key, stats in by_staff.items()]
    items.sort(key=lambda item: (-item["total_tasks"], item["staff_id"]))

    return {
        "generated_at": _now_iso(),
        "filters": _filters_block(start_date, end_date, staff_id),
        "items": items,
    }


def tag_summary(actor: dict, start_date: date | None = None, end_date: date | None = None, staff_id: str | None = None) -> dict:
    jwt = _admin_jwt(actor)

    tasks = sb_get(
        f"{REST}/tasks",
        user_jwt=jwt,
        params=_task_params(start_date, end_date, staff_id, select="id"),
    )
    task_ids = [task["id"] for task in tasks if task.get("id")]

    if not task_ids:
        return {
            "generated_at": _now_iso(),
            "filters": _filters_block(start_date, end_date, staff_id),
            "items": [],
        }

    tags = sb_get(f"{REST}/tags", user_jwt=jwt, params={"select": "id,name"})
    tag_name_by_id = {tag["id"]: tag["name"] for tag in tags if tag.get("id")}

    joins = sb_get(
        f"{REST}/task_tags",
        user_jwt=jwt,
        params={
            "select": "task_id,tag_id",
            "task_id": f"in.({','.join(task_ids)})",
        },
    )

    counts = defaultdict(int)
    for join in joins:
        label = tag_name_by_id.get(join.get("tag_id"), str(join.get("tag_id")))
        counts[label] += 1

    items = [{"tag": tag, "total_tasks": total} for tag, total in counts.items()]
    items.sort(key=lambda item: (-item["total_tasks"], item["tag"]))

    return {
        "generated_at": _now_iso(),
        "filters": _filters_block(start_date, end_date, staff_id),
        "items": items,
    }


def export_tasks_summary_csv(actor: dict, start_date: date | None = None, end_date: date | None = None, staff_id: str | None = None) -> io.BytesIO:
    report = tasks_summary(actor, start_date=start_date, end_date=end_date, staff_id=staff_id)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Report", "Tasks Summary"])
    writer.writerow(["Generated At", report["generated_at"]])
    writer.writerow(["Start Date", report["filters"]["start_date"]])
    writer.writerow(["End Date", report["filters"]["end_date"]])
    writer.writerow(["Staff ID", report["filters"]["staff_id"]])
    writer.writerow([])
    writer.writerow(["total_tasks", report["total_tasks"]])
    writer.writerow(["open_tasks", report["open_tasks"]])
    writer.writerow(["closed_tasks", report["closed_tasks"]])
    writer.writerow([])
    writer.writerow(["status", "count"])
    for row in report["by_status"]:
        writer.writerow([row["label"], row["count"]])
    out = io.BytesIO(buf.getvalue().encode("utf-8-sig"))
    out.seek(0)
    return out


def export_staff_summary_csv(actor: dict, start_date: date | None = None, end_date: date | None = None, staff_id: str | None = None) -> io.BytesIO:
    report = staff_summary(actor, start_date=start_date, end_date=end_date, staff_id=staff_id)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Report", "Staff Summary"])
    writer.writerow(["Generated At", report["generated_at"]])
    writer.writerow(["Start Date", report["filters"]["start_date"]])
    writer.writerow(["End Date", report["filters"]["end_date"]])
    writer.writerow(["Staff ID", report["filters"]["staff_id"]])
    writer.writerow([])
    writer.writerow(["staff_id", "total_tasks", "open_tasks", "closed_tasks"])
    for row in report["items"]:
        writer.writerow([row["staff_id"], row["total_tasks"], row["open_tasks"], row["closed_tasks"]])
    out = io.BytesIO(buf.getvalue().encode("utf-8-sig"))
    out.seek(0)
    return out


def export_tag_summary_csv(actor: dict, start_date: date | None = None, end_date: date | None = None, staff_id: str | None = None) -> io.BytesIO:
    report = tag_summary(actor, start_date=start_date, end_date=end_date, staff_id=staff_id)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Report", "Tag Summary"])
    writer.writerow(["Generated At", report["generated_at"]])
    writer.writerow(["Start Date", report["filters"]["start_date"]])
    writer.writerow(["End Date", report["filters"]["end_date"]])
    writer.writerow(["Staff ID", report["filters"]["staff_id"]])
    writer.writerow([])
    writer.writerow(["tag", "total_tasks"])
    for row in report["items"]:
        writer.writerow([row["tag"], row["total_tasks"]])
    out = io.BytesIO(buf.getvalue().encode("utf-8-sig"))
    out.seek(0)
    return out


def _pdf_header(pdf: canvas.Canvas, title: str, generated_at: str, start_date: str | None, end_date: str | None, staff_id: str | None):
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(1 * inch, 10.5 * inch, title)
    pdf.setFont("Helvetica", 10)
    pdf.drawString(1 * inch, 10.2 * inch, f"Generated at: {generated_at}")
    pdf.drawString(1 * inch, 10.0 * inch, f"Start date: {start_date or '-'}")
    pdf.drawString(4.0 * inch, 10.0 * inch, f"End date: {end_date or '-'}")
    pdf.drawString(1 * inch, 9.8 * inch, f"Staff ID: {staff_id or '-'}")


def export_tasks_summary_pdf(actor: dict, start_date: date | None = None, end_date: date | None = None, staff_id: str | None = None) -> io.BytesIO:
    report = tasks_summary(actor, start_date=start_date, end_date=end_date, staff_id=staff_id)
    out = io.BytesIO()
    pdf = canvas.Canvas(out, pagesize=letter)
    _pdf_header(pdf, "Tasks Summary", report["generated_at"], report["filters"]["start_date"], report["filters"]["end_date"], report["filters"]["staff_id"])
    y = 9.4 * inch
    pdf.drawString(1 * inch, y, f"Total tasks: {report['total_tasks']}")
    y -= 0.2 * inch
    pdf.drawString(1 * inch, y, f"Open tasks: {report['open_tasks']}")
    y -= 0.2 * inch
    pdf.drawString(1 * inch, y, f"Closed tasks: {report['closed_tasks']}")
    y -= 0.35 * inch
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(1 * inch, y, "Status")
    pdf.drawString(4 * inch, y, "Count")
    pdf.setFont("Helvetica", 10)
    for row in report["by_status"]:
        y -= 0.22 * inch
        if y < 1 * inch:
            pdf.showPage()
            y = 10.3 * inch
            pdf.setFont("Helvetica", 10)
        pdf.drawString(1 * inch, y, row["label"])
        pdf.drawString(4 * inch, y, str(row["count"]))
    pdf.save()
    out.seek(0)
    return out


def export_staff_summary_pdf(actor: dict, start_date: date | None = None, end_date: date | None = None, staff_id: str | None = None) -> io.BytesIO:
    report = staff_summary(actor, start_date=start_date, end_date=end_date, staff_id=staff_id)
    out = io.BytesIO()
    pdf = canvas.Canvas(out, pagesize=letter)
    _pdf_header(pdf, "Staff Summary", report["generated_at"], report["filters"]["start_date"], report["filters"]["end_date"], report["filters"]["staff_id"])
    y = 9.5 * inch
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(1 * inch, y, "Staff ID")
    pdf.drawString(3 * inch, y, "Total")
    pdf.drawString(4 * inch, y, "Open")
    pdf.drawString(5 * inch, y, "Closed")
    pdf.setFont("Helvetica", 10)
    for row in report["items"]:
        y -= 0.22 * inch
        if y < 1 * inch:
            pdf.showPage()
            y = 10.3 * inch
            pdf.setFont("Helvetica", 10)
        pdf.drawString(1 * inch, y, row["staff_id"])
        pdf.drawString(3 * inch, y, str(row["total_tasks"]))
        pdf.drawString(4 * inch, y, str(row["open_tasks"]))
        pdf.drawString(5 * inch, y, str(row["closed_tasks"]))
    pdf.save()
    out.seek(0)
    return out


def export_tag_summary_pdf(actor: dict, start_date: date | None = None, end_date: date | None = None, staff_id: str | None = None) -> io.BytesIO:
    report = tag_summary(actor, start_date=start_date, end_date=end_date, staff_id=staff_id)
    out = io.BytesIO()
    pdf = canvas.Canvas(out, pagesize=letter)
    _pdf_header(pdf, "Tag Summary", report["generated_at"], report["filters"]["start_date"], report["filters"]["end_date"], report["filters"]["staff_id"])
    y = 9.5 * inch
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(1 * inch, y, "Tag")
    pdf.drawString(4.5 * inch, y, "Tasks")
    pdf.setFont("Helvetica", 10)
    for row in report["items"]:
        y -= 0.22 * inch
        if y < 1 * inch:
            pdf.showPage()
            y = 10.3 * inch
            pdf.setFont("Helvetica", 10)
        pdf.drawString(1 * inch, y, row["tag"])
        pdf.drawString(4.5 * inch, y, str(row["total_tasks"]))
    pdf.save()
    out.seek(0)
    return out
