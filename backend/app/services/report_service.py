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
from app.services.audit_service import log_audit

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


def _filters_block(start_date, end_date, staff_id):
    return {
        "start_date": start_date.isoformat() if start_date else None,
        "end_date": end_date.isoformat() if end_date else None,
        "staff_id": staff_id,
    }


def _task_params(start_date, end_date, staff_id, *, select):
    params = {"select": select}
    if start_date:
        params["created_at"] = f"gte.{start_date.isoformat()}"
    if end_date:
        params["created_at"] = f"lte.{end_date.isoformat()}"
    if staff_id:
        params["assigned_to"] = f"eq.{staff_id}"
    return params


# =========================
# SUMMARY FUNCTIONS
# =========================

def tasks_summary(actor, start_date=None, end_date=None, staff_id=None):
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
        status = (row.get("status") or "pending").lower()
        counts[status] += 1

    by_status = [
        {"key": s, "label": DISPLAY_STATUS[s], "count": counts[s]}
        for s in CANONICAL_STATUSES
    ]

    return {
        "generated_at": _now_iso(),
        "filters": _filters_block(start_date, end_date, staff_id),
        "total_tasks": sum(counts.values()),
        "open_tasks": sum(v for k, v in counts.items() if k not in CLOSED_STATUSES),
        "closed_tasks": sum(v for k, v in counts.items() if k in CLOSED_STATUSES),
        "by_status": by_status,
    }


def staff_summary(actor, start_date=None, end_date=None, staff_id=None):
    jwt = _admin_jwt(actor)

    tasks = sb_get(
        f"{REST}/tasks",
        user_jwt=jwt,
        params=_task_params(start_date, end_date, staff_id, select="assigned_to,status"),
    )

    stats = defaultdict(lambda: {"total_tasks": 0, "open_tasks": 0, "closed_tasks": 0})

    for t in tasks:
        sid = t.get("assigned_to")
        if not sid:
            continue

        stats[sid]["total_tasks"] += 1

        status = (t.get("status") or "pending").lower()
        if status in CLOSED_STATUSES:
            stats[sid]["closed_tasks"] += 1
        else:
            stats[sid]["open_tasks"] += 1

    return {
        "generated_at": _now_iso(),
        "filters": _filters_block(start_date, end_date, staff_id),
        "items": [{"staff_id": k, **v} for k, v in stats.items()],
    }


def tag_summary(actor, start_date=None, end_date=None, staff_id=None):
    jwt = _admin_jwt(actor)

    tasks = sb_get(
        f"{REST}/tasks",
        user_jwt=jwt,
        params=_task_params(start_date, end_date, staff_id, select="id"),
    )
    task_ids = [t["id"] for t in tasks if t.get("id")]

    if not task_ids:
        return {"generated_at": _now_iso(), "filters": {}, "items": []}

    tags = sb_get(f"{REST}/tags", user_jwt=jwt, params={"select": "id,name"})
    tag_map = {t["id"]: t["name"] for t in tags}

    joins = sb_get(
        f"{REST}/task_tags",
        user_jwt=jwt,
        params={"task_id": f"in.({','.join(task_ids)})"},
    )

    counts = defaultdict(int)
    for j in joins:
        counts[tag_map.get(j["tag_id"], "unknown")] += 1

    return {
        "generated_at": _now_iso(),
        "filters": {},
        "items": [{"tag": k, "total_tasks": v} for k, v in counts.items()],
    }


# =========================
# CSV EXPORTS
# =========================

def export_tasks_summary_csv(actor, start_date=None, end_date=None, staff_id=None):
    report = tasks_summary(actor, start_date, end_date, staff_id)

    log_audit(actor=actor, action="generate_report", entity_type="report")

    buf = io.StringIO()
    writer = csv.writer(buf)

    for row in report["by_status"]:
        writer.writerow([row["label"], row["count"]])

    out = io.BytesIO(buf.getvalue().encode())
    out.seek(0)
    return out


def export_staff_summary_csv(actor, start_date=None, end_date=None, staff_id=None):
    report = staff_summary(actor, start_date, end_date, staff_id)

    log_audit(actor=actor, action="generate_report", entity_type="report")

    buf = io.StringIO()
    writer = csv.writer(buf)

    for row in report["items"]:
        writer.writerow(row.values())

    out = io.BytesIO(buf.getvalue().encode())
    out.seek(0)
    return out


def export_tag_summary_csv(actor, start_date=None, end_date=None, staff_id=None):
    report = tag_summary(actor, start_date, end_date, staff_id)

    log_audit(actor=actor, action="generate_report", entity_type="report")

    buf = io.StringIO()
    writer = csv.writer(buf)

    for row in report["items"]:
        writer.writerow(row.values())

    out = io.BytesIO(buf.getvalue().encode())
    out.seek(0)
    return out


# =========================
# PDF EXPORTS (FIXED)
# =========================

def export_tasks_summary_pdf(actor, start_date=None, end_date=None, staff_id=None):
    report = tasks_summary(actor, start_date, end_date, staff_id)

    log_audit(actor=actor, action="generate_report", entity_type="report")

    out = io.BytesIO()
    pdf = canvas.Canvas(out, pagesize=letter)

    y = 10 * inch
    for row in report["by_status"]:
        pdf.drawString(1 * inch, y, f"{row['label']}: {row['count']}")
        y -= 0.3 * inch

    pdf.save()
    out.seek(0)
    return out


def export_staff_summary_pdf(actor, start_date=None, end_date=None, staff_id=None):
    report = staff_summary(actor, start_date, end_date, staff_id)

    log_audit(actor=actor, action="generate_report", entity_type="report")

    out = io.BytesIO()
    pdf = canvas.Canvas(out, pagesize=letter)

    y = 10 * inch
    for row in report["items"]:
        pdf.drawString(1 * inch, y, str(row))
        y -= 0.3 * inch

    pdf.save()
    out.seek(0)
    return out


def export_tag_summary_pdf(actor, start_date=None, end_date=None, staff_id=None):
    report = tag_summary(actor, start_date, end_date, staff_id)

    log_audit(actor=actor, action="generate_report", entity_type="report")

    out = io.BytesIO()
    pdf = canvas.Canvas(out, pagesize=letter)

    y = 10 * inch
    for row in report["items"]:
        pdf.drawString(1 * inch, y, str(row))
        y -= 0.3 * inch

    pdf.save()
    out.seek(0)
    return out