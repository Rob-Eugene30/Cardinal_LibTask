import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/staff/Dashboard";
import RequireRole from "../components/RequireRole";

export default function StaffRoutes() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="dashboard" replace />} />

      {/* Protected Staff Dashboard */}
      <Route
        path="dashboard"
        element={
          <RequireRole role="staff">
            <Dashboard />
          </RequireRole>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
