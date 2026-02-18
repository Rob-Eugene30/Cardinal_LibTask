import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../../lib/auth";
import "./AdminLayout.css";

type NavItem = {
  label: string;
  to: string;
  icon: string; // using simple emoji/unicode so no icon library needed
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

  // Highlight correct sidebar item even when inside nested routes
  const navItems: NavItem[] = useMemo(
    () => [
      { label: "Dashboard", to: "/admin", icon: "🏠" },
      { label: "Create Task", to: "/admin/create-tasks", icon: "➕" },
      { label: "Tasks", to: "/admin/tasks", icon: "✅" },
      { label: "Calendar", to: "/admin/calendar", icon: "🗓️" },
      { label: "Audit Trail", to: "/admin/audit-trail", icon: "🧾" },
    ],
    []
  );

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/admin/tasks")) return "Tasks";
    if (path.startsWith("/admin/create-tasks")) return "Create Task";
    if (path.startsWith("/admin/calendar")) return "Calendar";
    if (path.startsWith("/admin/audit-trail")) return "Audit Trail";
    return "Dashboard";
  }, [location.pathname]);

  return (
    <div className="adm-shell">
      {/* Left Sidebar */}
      <aside className={`adm-sidebar ${collapsed ? "is-collapsed" : ""}`}>
        <div className="adm-sidebar__brand">
          <div className="adm-brand__logo" aria-hidden="true">
            CL
          </div>
          {!collapsed && (
            <div className="adm-brand__text">
              <div className="adm-brand__name">Cardinal LibTask</div>
              <div className="adm-brand__sub">Admin</div>
            </div>
          )}
        </div>

        <nav className="adm-nav" aria-label="Admin navigation">
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
              <span className="adm-nav__icon" aria-hidden="true">
                {item.icon}
              </span>
              {!collapsed && <span className="adm-nav__label">{item.label}</span>}
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
            title={collapsed ? "Logout" : undefined}
          >
            <span className="adm-nav__icon" aria-hidden="true">
              ⎋
            </span>
            {!collapsed && <span className="adm-nav__label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="adm-main">
        {/* Top Bar */}
        <header className="adm-topbar">
          <button
            className="adm-topbar__menu"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            ☰
          </button>

          <div className="adm-topbar__title">{pageTitle}</div>

          <div className="adm-topbar__right">
            {/* Placeholder user chip for now */}
            <div className="adm-userchip" title="Logged in">
              <span className="adm-userchip__dot" aria-hidden="true" />
              <span className="adm-userchip__text">Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className="adm-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
