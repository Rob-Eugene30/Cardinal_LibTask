import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../components/layout/AdminLayout.css";

type StaffStatus = "Active" | "Inactive";
type StaffAvailability = "On Duty" | "Available" | "Leave";

type StaffRow = {
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
  if (kind === "status") {
    return value === "Active" ? "adm-pill is-green" : "adm-pill is-gray";
  }
  if (value === "On Duty") return "adm-pill is-blue";
  if (value === "Leave") return "adm-pill is-amber";
  return "adm-pill is-green-soft";
}

export default function AdminStaffList() {
  const navigate = useNavigate();

  const [staffList, setStaffList] = useState<StaffRow[]>([
    {
      id: "S-001",
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "+63 917 123 4567",
      role: "Librarian",
      availability: "On Duty",
      status: "Active",
    },
    {
      id: "S-002",
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      phone: "+63 917 555 9012",
      role: "Assistant Librarian",
      availability: "Available",
      status: "Active",
    },
    {
      id: "S-003",
      name: "Mike Brown",
      email: "mike.brown@example.com",
      phone: "+63 918 222 3344",
      role: "Archivist",
      availability: "Leave",
      status: "Active",
    },
    {
      id: "S-004",
      name: "Emma Davis",
      email: "emma.davis@example.com",
      phone: "+63 919 888 1212",
      role: "Library Aide",
      availability: "Available",
      status: "Inactive",
    },
  ]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"All" | StaffStatus>("All");
  const [showAdd, setShowAdd] = useState(false);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return staffList.filter((s) => {
      const matchQ =
        !query ||
        s.id.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.phone.toLowerCase().includes(query);

      const matchStatus = status === "All" ? true : s.status === status;
      return matchQ && matchStatus;
    });
  }, [q, status, staffList]);

  return (
    <div className="adm-page">
      <div className="adm-page__top">
        <div>
          <h1 className="adm-page__title">Staff</h1>
          <p className="adm-page__sub">View and manage all staff</p>
        </div>

        <button
          className="adm-btn adm-btn--primary"
          onClick={() => setShowAdd(true)}
        >
          ＋ Add Staff
        </button>
      </div>

      <div className="adm-card adm-toolbar">
        <div className="adm-search">
          <span className="adm-search__icon">🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, ID, email, or phone..."
          />
        </div>

        <div className="adm-toolbar__right">
          <div className="adm-filter">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

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
            {rows.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.phone}</td>
                <td>{s.role}</td>
                <td>
                  <span className={pillClass("avail", s.availability)}>
                    {s.availability}
                  </span>
                </td>
                <td>
                  <span className={pillClass("status", s.status)}>
                    {s.status}
                  </span>
                </td>
                <td>
                  <button
                    className="adm-iconbtn is-blue"
                    onClick={() =>
                      navigate(`/admin/staff/${encodeURIComponent(s.id)}`)
                    }
                  >
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
          onSave={(newStaff) => {
            setStaffList([...staffList, newStaff]);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

type AddStaffModalProps = {
  onClose: () => void;
  onSave: (staff: StaffRow) => void;
};

function AddStaffModal({ onClose, onSave }: AddStaffModalProps) {
  const [form, setForm] = useState<StaffRow>({
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "",
    availability: "Available",
    status: "Active",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="adm-modal-overlay">
      <div className="adm-modal">
        <h2>Add Staff</h2>

        <form onSubmit={handleSubmit} className="adm-form">
          <input name="id" placeholder="Staff ID" required onChange={handleChange} />
          <input name="name" placeholder="Full Name" required onChange={handleChange} />
          <input name="email" placeholder="Email" required onChange={handleChange} />
          <input name="phone" placeholder="Phone" required onChange={handleChange} />
          <input name="role" placeholder="Role" required onChange={handleChange} />

          <select name="availability" onChange={handleChange}>
            <option value="Available">Available</option>
            <option value="On Duty">On Duty</option>
            <option value="Leave">Leave</option>
          </select>

          <select name="status" onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div className="adm-modal__actions">
            <button type="button" onClick={onClose} className="adm-btn adm-btn--ghost">
              Cancel
            </button>
            <button type="submit" className="adm-btn adm-btn--primary">
              Save Staff
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}