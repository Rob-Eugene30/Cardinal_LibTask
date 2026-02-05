import { Outlet } from "react-router-dom";
import { logout } from "../../lib/auth";

export default function StaffLayout() {
  return (
    <>
      <div className="header staff-header">
        <strong>Staff Panel</strong>
        <button className="logout" onClick={() => { logout(); location.href="/login"; }}>
          Logout
        </button>
      </div>

      <Outlet />
    </>
  );
}
