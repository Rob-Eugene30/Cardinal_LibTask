import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./StaffLayout.css";

export default function StaffLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("clt_access_token");
    navigate("/login");
  };

  return (
    <div className="stf-shell">
      {/* SIDEBAR */}
      <aside className="stf-sidebar">
        
        {/* BRAND */}
        <div className="stf-brand">
          <div className="stf-brand__logo">CL</div>
          <div>
            <div className="stf-brand__title">Cardinal LibTask</div>
            <div className="stf-brand__sub">Staff</div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="stf-nav">
          <NavLink
            to="/staff/dashboard"
            className={({ isActive }) =>
              isActive ? "stf-nav__item is-active" : "stf-nav__item"
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/staff/tasks"
            className={({ isActive }) =>
              isActive ? "stf-nav__item is-active" : "stf-nav__item"
            }
          >
            My Tasks
          </NavLink>
        </nav>

        {/* FOOTER */}
        <div style={{ marginTop: "auto" }}>
          <button
            className="stf-nav__item"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="stf-main">
        <Outlet />
      </main>
    </div>
  );
}
