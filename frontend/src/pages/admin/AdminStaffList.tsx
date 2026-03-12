import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { getStaff, inviteStaff, type StaffProfile as ApiStaffProfile } from "../../api/staff";
import "../../components/layout/AdminLayout.css";

type StaffStatus = "Active" | "Inactive";
type StaffAvailability = "On Duty" | "Available" | "Leave";

type StaffRow = {
  uuid: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  availability: StaffAvailability;
  status: StaffStatus;
};

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M12 5c5.5 0 9.5 4.5 10.8 6.2a1.3 1.3 0 0 1 0 1.6C21.5 14.5 17.5 19 12 19S2.5 14.5 1.2 12.8a1.3 1.3 0 0 1 0-1.6C2.5 9.5 6.5 5 12 5Zm0 2C7.8 7 4.4 10.5 3.2 12c1.2 1.5 4.6 5 8.8 5s7.6-3.5 8.8-5C19.6 10.5 16.2 7 12 7Zm0 2.5A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5Z"
      />
    </svg>
  );
}

function pillClass(kind: "status" | "avail", value: string) {
  if (kind === "status") return value === "Active" ? "adm-pill is-green" : "adm-pill is-gray";
  if (value === "On Duty") return "adm-pill is-blue";
  if (value === "Leave") return "adm-pill is-amber";
  return "adm-pill is-green-soft";
}

function normalizeAvailability(value: unknown): StaffAvailability {
  const text = String(value ?? "").trim();
  if (text === "On Duty") return "On Duty";
  if (text === "Leave") return "Leave";
  return "Available";
}

function normalizeStatus(value: unknown): StaffStatus {
  return String(value ?? "").trim() === "Inactive" ? "Inactive" : "Active";
}

function toRow(profile: ApiStaffProfile): StaffRow {
  return {
    uuid: profile.id,
    id: String(profile.staff_code ?? profile.id),
    name: String(profile.full_name ?? ""),
    email: String(profile.email ?? ""),
    phone: String(profile.phone ?? ""),
    role: String(profile.job_title ?? ""),
    availability: normalizeAvailability(profile.availability),
    status: normalizeStatus(profile.employment_status),
  };
}

export default function AdminStaffList() {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | StaffStatus>("All");
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadStaff() {
    const rows = await getStaff();
    setStaffList(rows.map(toRow));
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        await loadStaff();
      } catch (err) {
        if (!alive) return;
        setError((err as Error)?.message ?? "Failed to load staff.");
        setStaffList([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return staffList.filter((staff) => {
      const matchesQuery =
        !normalizedQuery ||
        staff.id.toLowerCase().includes(normalizedQuery) ||
        staff.name.toLowerCase().includes(normalizedQuery) ||
        staff.email.toLowerCase().includes(normalizedQuery) ||
        staff.phone.toLowerCase().includes(normalizedQuery);

      const matchesStatus = status === "All" ? true : staff.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, staffList, status]);

  return (
    <div className="adm-page">
      <div className="adm-page__top">
        <div>
          <h1 className="adm-page__title">Staff</h1>
          <p className="adm-page__sub">View and manage all staff</p>
        </div>

        <button className="adm-btn adm-btn--primary" onClick={() => setShowAdd(true)}>
          ＋ Add Staff
        </button>
      </div>

      <div className="adm-card adm-toolbar">
        <div className="adm-search">
          <span className="adm-search__icon">🔍</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, ID, email, or phone..." />
        </div>

        <div className="adm-toolbar__right">
          <div className="adm-filter">
            <select value={status} onChange={(event) => setStatus(event.target.value as "All" | StaffStatus)}>
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="adm-form-error">{error}</div>}

      <div className="adm-card adm-tablewrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Staff ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Availability</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((staff) => (
              <tr key={staff.uuid}>
                <td>{staff.id}</td>
                <td>{staff.name}</td>
                <td>{staff.email}</td>
                <td>{staff.phone}</td>
                <td>{staff.role}</td>
                <td>
                  <span className={pillClass("avail", staff.availability)}>{staff.availability}</span>
                </td>
                <td>
                  <span className={pillClass("status", staff.status)}>{staff.status}</span>
                </td>
                <td>
                  <button className="adm-iconbtn is-blue" onClick={() => navigate(`/admin/staff/${encodeURIComponent(staff.uuid)}`)}>
                    <EyeIcon />
                  </button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="adm-empty">
                  No staff found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddStaffModal
          onClose={() => setShowAdd(false)}
          onSave={async (newStaff) => {
            await inviteStaff({
              staff_code: newStaff.id,
              full_name: newStaff.name,
              email: newStaff.email,
              phone: newStaff.phone,
              job_title: newStaff.role,
              availability: newStaff.availability,
              employment_status: newStaff.status,
            });
            await loadStaff();
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

type AddStaffModalProps = {
  onClose: () => void;
  onSave: (staff: StaffRow) => void | Promise<void>;
};

function AddStaffModal({ onClose, onSave }: AddStaffModalProps) {
  const [form, setForm] = useState<StaffRow>({
    uuid: "",
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "",
    availability: "Available",
    status: "Active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value } as StaffRow));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      setError((err as Error)?.message ?? "Failed to save staff.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="adm-modal-overlay">
      <div className="adm-modal">
        <h2>Add Staff</h2>

        <form onSubmit={handleSubmit} className="adm-form">
          <input name="id" placeholder="Staff ID" required onChange={handleChange} value={form.id} />
          <input name="name" placeholder="Full Name" required onChange={handleChange} value={form.name} />
          <input name="email" placeholder="Email" required onChange={handleChange} value={form.email} />
          <input name="phone" placeholder="Phone" required onChange={handleChange} value={form.phone} />
          <input name="role" placeholder="Role" required onChange={handleChange} value={form.role} />

          <select name="availability" onChange={handleChange} value={form.availability}>
            <option value="Available">Available</option>
            <option value="On Duty">On Duty</option>
            <option value="Leave">Leave</option>
          </select>

          <select name="status" onChange={handleChange} value={form.status}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {error && <div className="adm-form-error">{error}</div>}

          <div className="adm-modal__actions">
            <button type="button" onClick={onClose} className="adm-btn adm-btn--ghost">
              Cancel
            </button>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={saving}>
              {saving ? "Saving..." : "Save Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
