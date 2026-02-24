import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../components/layout/AdminLayout.css";

type Staff = {
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

const MOCK: Staff[] = [
  {
    id: "S-001",
    name: "John Smith",
    email: "john.smith@example.com",
    address: "123 Main Street, Manila",
    phone: "+63 917 123 4567",
    department: "Main Library",
    role: "Librarian",
    availability: "On Duty",
    status: "Active",
    employeeSince: "2021-03-15",
  },
  {
    id: "S-002",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    address: "Unit 5, Quezon City",
    phone: "+63 917 555 9012",
    department: "Circulation",
    role: "Assistant Librarian",
    availability: "Available",
    status: "Active",
    employeeSince: "2022-11-20",
  },
];

function pill(value: string) {
  if (value === "On Duty") return "adm-pill is-blue";
  if (value === "Leave") return "adm-pill is-amber";
  if (value === "Active") return "adm-pill is-green";
  if (value === "Inactive") return "adm-pill is-gray";
  return "adm-pill is-green-soft";
}

export default function AdminStaffProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const staff = useMemo(
    () => MOCK.find((s) => s.id === id) || null,
    [id]
  );

  const trainings = [
    { title: "Library Cataloging Basics", date: "2024-01-15" },
    { title: "Customer Service Training", date: "2023-11-20" },
    { title: "Archive Handling & Preservation", date: "2023-08-10" },
  ];

  const incidents = [
    { title: "Late Return Handling Issue", date: "2025-10-05", level: "Minor" },
    { title: "Mis-shelved Books Report", date: "2025-06-12", level: "Minor" },
  ];

  const activity = [
    { id: "A-301", date: "2025-12-28", action: "Shift Completed", notes: "Front desk" },
    { id: "A-285", date: "2025-12-20", action: "Inventory Check", notes: "Section V-007" },
    { id: "A-267", date: "2025-12-15", action: "Catalog Update", notes: "New arrivals" },
    { id: "A-251", date: "2025-12-08", action: "Assist Borrowers", notes: "Peak hours" },
  ];

  if (!staff) {
    return (
      <div className="adm-page">
        <button
          className="adm-link"
          onClick={() => navigate("/admin/AdminStaffList")}
          type="button"
        >
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
      {/* HEADER */}
      <div className="adm-page__top">
        <div>
          <h1 className="adm-page__title">Staff Profile</h1>
        </div>

        <div className="adm-top-actions">
          <button
            className="adm-btn adm-btn--ghost"
            type="button"
            onClick={() => alert("Hook to Edit Staff")}
          >
            ✏️ Edit
          </button>

          <button
            className="adm-btn adm-btn--danger"
            type="button"
            onClick={() => {
              const confirmDelete = window.confirm(
                "Are you sure you want to delete this staff?"
              );
              if (confirmDelete) {
                console.log("Deleting:", staff.id);
                navigate("/admin/AdminStaffList");
              }
            }}
          >
            🗑 Delete
          </button>
        </div>
      </div>

      {/* BACK BUTTON */}
      <button
        className="adm-link"
        onClick={() => navigate("/admin/AdminStaffList")}
        type="button"
      >
        ← Back to Staff List
      </button>

      {/* PROFILE CARD */}
      <div className="adm-card adm-profile">
        <div className="adm-avatar">
          {staff.name
            .split(" ")
            .map((x) => x[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>

        <div className="adm-profile__main">
          <div className="adm-profile__row">
            <div>
              <div className="adm-name">{staff.name}</div>
              <div className="adm-muted">Staff ID: {staff.id}</div>
            </div>

            <span className={pill(staff.availability)}>
              {staff.availability}
            </span>
          </div>

          <div className="adm-profile__meta">
            <div className="adm-metaitem">✉️ {staff.email}</div>
            <div className="adm-metaitem">📍 {staff.address}</div>
            <div className="adm-metaitem">📞 {staff.phone}</div>
            <div className="adm-metaitem">🏢 {staff.department}</div>
          </div>
        </div>
      </div>

      {/* EMPLOYMENT INFO */}
      <div className="adm-card adm-section">
        <h2 className="adm-h2">Employment Information</h2>

        <div className="adm-grid2">
          <div>
            <div className="adm-label">Role</div>
            <div className="adm-value">{staff.role}</div>

            <div style={{ height: 14 }} />

            <div className="adm-label">Employee Since</div>
            <div className="adm-value">{staff.employeeSince}</div>
          </div>

          <div>
            <div className="adm-label">Status</div>
            <div className="adm-value">
              <span className={pill(staff.status)}>
                {staff.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TRAININGS + INCIDENTS */}
      <div className="adm-row2">
        <div className="adm-card adm-section">
          <h2 className="adm-h2">Training & Certifications</h2>

          <div className="adm-list">
            {trainings.map((t) => (
              <div className="adm-listitem" key={t.title}>
                <div>{t.title}</div>
                <div className="adm-muted">{t.date}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="adm-card adm-section">
          <h2 className="adm-h2">Incidents Summary</h2>

          <div className="adm-list">
            {incidents.map((v) => (
              <div className="adm-incident" key={v.title}>
                <div>
                  <div>{v.title}</div>
                  <div className="adm-muted">{v.date}</div>
                </div>
                <span className="adm-pill is-amber">
                  {v.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ACTIVITY HISTORY */}
      <div className="adm-card adm-section">
        <h2 className="adm-h2">Activity History</h2>

        <div className="adm-tablewrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Activity ID</th>
                <th>Date</th>
                <th>Action</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((a) => (
                <tr key={a.id}>
                  <td className="adm-mono">{a.id}</td>
                  <td>{a.date}</td>
                  <td>{a.action}</td>
                  <td className="adm-muted">{a.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}