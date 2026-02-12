import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "../pages/admin/Dashboard";
import Tasks from "../pages/admin/Tasks";
import CreateTasks from "../pages/admin/CreateTasks";
import Reports from "../pages/admin/Reports";
import RequireRole from "../components/RequireRole";

export default function AdminRoutes() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="dashboard" replace />} />

      {/* Protected Admin Pages */}
      <Route
        path="dashboard"
        element={
          <RequireRole role="admin">
            <Dashboard />
          </RequireRole>
        }
      />

      <Route
        path="tasks"
        element={
          <RequireRole role="admin">
            <Tasks />
          </RequireRole>
        }
      />

      <Route
        path="create-tasks"
        element={
          <RequireRole role="admin">
            <CreateTasks />
          </RequireRole>
        }
      />

      <Route
        path="reports"
        element={
          <RequireRole role="admin">
            <Reports />
          </RequireRole>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
