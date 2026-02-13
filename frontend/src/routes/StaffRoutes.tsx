import { Routes, Route, Navigate } from "react-router-dom";
import StaffLayout from "../components/layout/StaffLayout";
import Dashboard from "../pages/staff/Dashboard";

export default function StaffRoutes() {
  return (
    <Routes>
      <Route element={<StaffLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/staff" replace />} />
      </Route>
    </Routes>
  );
}
