import { Outlet } from "react-router-dom";
import { logout } from "../../lib/auth";

export default function AdminLayout() {
  return (
    <>
      <div className="header admin-header">
        <strong>Admin Panel</strong>
        <button className="logout" onClick={() => { logout(); location.href="/login"; }}>
          Logout
        </button>
      </div>

      <Outlet />
    </>
  );
}
