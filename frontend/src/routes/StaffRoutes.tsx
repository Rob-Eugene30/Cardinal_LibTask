import { Routes, Route, Navigate } from "react-router-dom";
import StaffLayout from "../components/layout/StaffLayout";
import Dashboard from "../pages/staff/Dashboard";
import StaffTask from "../pages/staff/StaffTask";
import StaffCalendar from "../pages/staff/StaffCalendar";

export default function StaffRoutes() {
  return (
    <Routes>
      <Route element={<StaffLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tasks" element={<StaffTask />} />
        <Route path="calendar" element={<StaffCalendar />} />
      </Route>
    </Routes>
  );
}