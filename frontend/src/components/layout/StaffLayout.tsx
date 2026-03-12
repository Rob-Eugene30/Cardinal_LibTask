import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../../lib/auth";
import "./StaffLayout.css";

type NavItem = {
  label: string;
  to: string;
};

export default function StaffLayout() {
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("staffSidebarCollapsed");
    return saved === "1";
  });

  useEffect(() => {
    localStorage.setItem("staffSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const navItems: NavItem[] = useMemo(
    () => [
      { label: "Dashboard", to: "/staff/dashboard" },
      { label: "My Tasks", to: "/staff/tasks" },
      { label: "Calendar", to: "/staff/calendar" },
    ],
    []
  );

  return (
    <div className="stf-shell">
      {/* Sidebar */}
      <aside className={`stf-sidebar ${collapsed ? "is-collapsed" : ""}`}>
        <div className="stf-sidebar__brand">
          <div className="stf-brand__logo">CL</div>

          {!collapsed && (
            <div className="stf-brand__text">
              <div className="stf-brand__name">Cardinal LibTask</div>
              <div className="stf-brand__sub">Staff</div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="stf-sidebar__toggle"
          onClick={() => setCollapsed((prev) => !prev)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "→" : "←"}
        </button>

        <nav className="stf-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/staff/dashboard"}
              className={({ isActive }) =>
                `stf-nav__item ${isActive ? "is-active" : ""}`
              }
              title={collapsed ? item.label : undefined}
            >
              {!collapsed && (
                <span className="stf-nav__label">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="stf-sidebar__footer">
          <button
            type="button"
            className="stf-logout"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            title={collapsed ? "Logout" : undefined}
          >
            {!collapsed && <span className="stf-nav__label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="stf-main">
        <section className="stf-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}