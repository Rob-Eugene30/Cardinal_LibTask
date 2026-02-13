import { logout } from "../../lib/auth";

export default function AdminDashboard() {
  return (
    <div style={{ padding: 16 }}>
      <h2>Admin Dashboard</h2>
      <p>Use the navigation by URL for now:</p>
      <ul>
        <li>/admin/tasks</li>
        <li>/admin/create-tasks</li>
      </ul>
      <button
        onClick={() => {
          logout();
          window.location.href = "/login";
        }}
      >
        Logout
      </button>
    </div>
  );
}
