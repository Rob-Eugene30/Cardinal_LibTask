import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { listStatusUpdates, type StatusUpdate } from "../../api/status";
import { deleteStaff, getStaffById, updateStaff, type StaffProfile } from "../../api/staff";
import { listTasks, type Task } from "../../api/tasks";
import { formatDate, formatDateTime, initialsFromName, safeLabel } from "../../lib/format";
import { getTaskStatusLabel } from "../../types/task";

type Staff = {
  uuid: string;
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  department: string;
  role: string;
  availability: "On Duty" | "Available" | "Leave";
  status: "Active" | "Inactive";
  employeeSince: string;
};

function pill(value: string) {
  if (value === "On Duty") return "adm-pill is-blue";
  if (value === "Leave") return "adm-pill is-amber";
  if (value === "Active") return "adm-pill is-green";
  if (value === "Inactive") return "adm-pill is-gray";
  return "adm-pill is-green-soft";
}

function normalizeAvailability(value: unknown): "On Duty" | "Available" | "Leave" {
  const text = String(value ?? "").trim();
  if (text === "On Duty") return "On Duty";
  if (text === "Leave") return "Leave";
  return "Available";
}

function normalizeStatus(value: unknown): "Active" | "Inactive" {
  return String(value ?? "").trim() === "Inactive" ? "Inactive" : "Active";
}

function toStaff(profile: StaffProfile): Staff {
  return {
    uuid: profile.id,
    id: String(profile.staff_code ?? profile.id),
    name: String(profile.full_name ?? ""),
    email: String(profile.email ?? ""),
    address: String(profile.address ?? "—"),
    phone: String(profile.phone ?? "—"),
    department: String(profile.department ?? "—"),
    role: String(profile.job_title ?? "—"),
    availability: normalizeAvailability(profile.availability),
    status: normalizeStatus(profile.employment_status),
    employeeSince: String(profile.employee_since ?? "—"),
  };
}

export default function AdminStaffProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<Array<StatusUpdate & { task_title?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    department: "",
    role: "",
    availability: "Available" as Staff["availability"],
    status: "Active" as Staff["status"],
    employeeSince: "",
    staffCode: "",
  });

  async function loadProfile(staffId: string) {
    setLoading(true);
    setError(null);

    try {
      const [profile, tasksRes] = await Promise.all([getStaffById(staffId), listTasks()]);
      const mapped = toStaff(profile);
      setStaff(mapped);
      setForm({
        name: mapped.name,
        phone: mapped.phone === "—" ? "" : mapped.phone,
        address: mapped.address === "—" ? "" : mapped.address,
        department: mapped.department === "—" ? "" : mapped.department,
        role: mapped.role === "—" ? "" : mapped.role,
        availability: mapped.availability,
        status: mapped.status,
        employeeSince: mapped.employeeSince === "—" ? "" : mapped.employeeSince,
        staffCode: mapped.id,
      });

      const mine = (tasksRes.items ?? []).filter((task) => task.assigned_to === staffId);
      setAssignedTasks(mine);

      const updates = await Promise.all(
        mine.map(async (task) => {
          try {
            const result = await listStatusUpdates(task.id);
            return (result.items ?? []).map((item) => ({ ...item, task_title: task.title }));
          } catch {
            return [];
          }
        }),
      );

      setHistory(
        updates
          .flat()
          .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
          .slice(0, 10),
      );
    } catch (err) {
      setError((err as Error)?.message ?? "Failed to load staff profile.");
      setStaff(null);
      setAssignedTasks([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) {
      setStaff(null);
      setLoading(false);
      return;
    }
    void loadProfile(id);
  }, [id]);

  const completedTasks = useMemo(() => assignedTasks.filter((task) => getTaskStatusLabel(task.status) === "Finished").length, [assignedTasks]);
  const initials = initialsFromName(staff?.name);

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      await updateStaff(id, {
        staff_code: form.staffCode,
        full_name: form.name,
        phone: form.phone || null,
        address: form.address || null,
        department: form.department || null,
        job_title: form.role || null,
        availability: form.availability,
        employment_status: form.status,
        employee_since: form.employeeSince || null,
      });
      setIsEditing(false);
      await loadProfile(id);
    } catch (err) {
      setError((err as Error)?.message ?? "Failed to update staff.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    const confirmed = window.confirm("Are you sure you want to deactivate this staff member?");
    if (!confirmed) return;

    try {
      await deleteStaff(id);
      navigate("/admin/AdminStaffList", { replace: true });
    } catch (err) {
      setError((err as Error)?.message ?? "Failed to deactivate staff.");
    }
  }

  if (loading) {
    return (
      <div className="adm-page">
        <div className="adm-card adm-pad">Loading staff profile...</div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="adm-page">
        <button className="adm-link" onClick={() => navigate("/admin/AdminStaffList")} type="button">
          ← Back to Staff List
        </button>

        <div className="adm-card adm-pad">
          <h2 className="adm-h2">Staff not found</h2>
          <p className="adm-muted">No record for: {id}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-page">
      <div className="adm-page__top">
        <div>
          <h1 className="adm-page__title">Staff Profile</h1>
        </div>

        <div className="adm-top-actions">
          {!isEditing ? (
            <button className="adm-btn adm-btn--ghost" type="button" onClick={() => setIsEditing(true)}>
              ✏️ Edit
            </button>
          ) : (
            <button className="adm-btn adm-btn--primary" type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          )}

          <button className="adm-btn adm-btn--danger" type="button" onClick={() => void handleDelete()}>
            🗑 Delete
          </button>
        </div>
      </div>

      <button className="adm-link" onClick={() => navigate("/admin/AdminStaffList")} type="button">
        ← Back to Staff List
      </button>

      {error && <div className="adm-form-error">{error}</div>}

      <div className="adm-card adm-profile">
        <div className="adm-avatar">{initials}</div>

        <div className="adm-profile__main">
          <div className="adm-profile__row">
            <div>
              <div className="adm-name">{staff.name}</div>
              <div className="adm-muted">Staff ID: {staff.id}</div>
            </div>

            <span className={pill(staff.availability)}>{staff.availability}</span>
          </div>

          <div className="adm-profile__meta">
            <div className="adm-metaitem">✉️ {staff.email}</div>
            <div className="adm-metaitem">📍 {staff.address}</div>
            <div className="adm-metaitem">📞 {staff.phone}</div>
            <div className="adm-metaitem">🏢 {staff.department}</div>
          </div>
        </div>
      </div>

      <div className="adm-card adm-section">
        <h2 className="adm-h2">Employment Information</h2>

        <div className="adm-grid2">
          <div>
            <div className="adm-label">Role</div>
            {isEditing ? (
              <input value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))} />
            ) : (
              <div className="adm-value">{staff.role}</div>
            )}

            <div style={{ height: 14 }} />

            <div className="adm-label">Employee Since</div>
            {isEditing ? (
              <input type="date" value={form.employeeSince} onChange={(event) => setForm((prev) => ({ ...prev, employeeSince: event.target.value }))} />
            ) : (
              <div className="adm-value">{formatDate(staff.employeeSince)}</div>
            )}
          </div>

          <div>
            <div className="adm-label">Status</div>
            {isEditing ? (
              <>
                <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as Staff["status"] }))}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <div style={{ height: 14 }} />
                <div className="adm-label">Availability</div>
                <select
                  value={form.availability}
                  onChange={(event) => setForm((prev) => ({ ...prev, availability: event.target.value as Staff["availability"] }))}
                >
                  <option value="Available">Available</option>
                  <option value="On Duty">On Duty</option>
                  <option value="Leave">Leave</option>
                </select>
              </>
            ) : (
              <div className="adm-value">
                <span className={pill(staff.status)}>{staff.status}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="adm-row2">
        <div className="adm-card adm-section">
          <h2 className="adm-h2">Task Summary</h2>
          <div className="adm-list">
            <div className="adm-listitem">
              <div>Total Assigned Tasks</div>
              <div className="adm-muted">{assignedTasks.length}</div>
            </div>
            <div className="adm-listitem">
              <div>Completed Tasks</div>
              <div className="adm-muted">{completedTasks}</div>
            </div>
          </div>
        </div>

        <div className="adm-card adm-section">
          <h2 className="adm-h2">Current Data Notes</h2>
          <div className="adm-list">
            <div className="adm-listitem">
              <div>Training & Certifications</div>
              <div className="adm-muted">No dedicated training table in the current schema.</div>
            </div>
            <div className="adm-listitem">
              <div>Incidents Summary</div>
              <div className="adm-muted">No incident records table in the current schema.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="adm-card adm-section">
        <h2 className="adm-h2">Assigned Tasks</h2>

        <div className="adm-tablewrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {assignedTasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{getTaskStatusLabel(task.status)}</td>
                  <td>{formatDate(task.due_date)}</td>
                </tr>
              ))}
              {assignedTasks.length === 0 && (
                <tr>
                  <td colSpan={3}>No tasks assigned to this staff member yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="adm-card adm-section">
        <h2 className="adm-h2">Activity History</h2>

        <div className="adm-tablewrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Task</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={item.id ?? `${item.task_id}-${index}`}>
                  <td>{formatDateTime(item.created_at)}</td>
                  <td>{safeLabel(item.task_title, item.task_id)}</td>
                  <td>{getTaskStatusLabel(item.status)}</td>
                  <td>{safeLabel(item.note, "—")}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={4}>No activity history available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
