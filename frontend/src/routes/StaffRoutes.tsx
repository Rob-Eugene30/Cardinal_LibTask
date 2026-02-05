import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/staff/Dashboard";

export default function StaffRoutes() {
  return (
    <Routes>
      {/* when user goes to /staff, redirect to /staff/dashboard */}
      <Route path="/" element={<Navigate to="dashboard" replace />} />

      <Route path="dashboard" element={<Dashboard />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
