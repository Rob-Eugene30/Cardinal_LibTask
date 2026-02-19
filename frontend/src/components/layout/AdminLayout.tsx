import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../../lib/auth";
import "./AdminLayout.css";

type NavItem = {
  label: string;
  to: string;
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("adminSidebarCollapsed");
    return saved === "1";
  });

  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const navItems: NavItem[] = useMemo(
    () => [
      { label: "Dashboard", to: "/admin" },
      { label: "Create Task", to: "/admin/create-tasks" },
      { label: "Tasks", to: "/admin/tasks" },
      { label: "Calendar", to: "/admin/calendar" },
      { label: "Audit Trail", to: "/admin/audit-trail" },
      { label: "Reports", to: "/admin/reports" },
    ],
    []
  );

  return (
    <div className="adm-shell">
      {/* Sidebar */}
      <aside className={`adm-sidebar ${collapsed ? "is-collapsed" : ""}`}>
        <div className="adm-sidebar__brand">
          <div className="adm-brand__logo">CL</div>

          {!collapsed && (
            <div className="adm-brand__text">
              <div className="adm-brand__name">Cardinal LibTask</div>
              <div className="adm-brand__sub">Admin</div>
            </div>
          )}
        </div>

        <nav className="adm-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                `adm-nav__item ${isActive ? "is-active" : ""}`
              }
              title={collapsed ? item.label : undefined}
            >
              {!collapsed && (
                <span className="adm-nav__label">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="adm-sidebar__footer">
          <button
            className="adm-logout"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            {!collapsed && (
              <span className="adm-nav__label">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Only */}
      <main className="adm-main">
        <section className="adm-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
