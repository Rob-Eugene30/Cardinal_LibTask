import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../components/layout/AdminLayout";

import Dashboard from "../pages/admin/Dashboard";
import Tasks from "../pages/admin/Tasks";
import CreateTasks from "../pages/admin/CreateTasks";
import Calendar from "../pages/admin/Calendar";
import AuditTrail from "../pages/admin/AuditTrail";
import Reports from "../pages/admin/Reports";
import AdminStaffList from "../pages/admin/AdminStaffList";
import AdminStaffProfile from "../pages/admin/AdminStaffProfile";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="create-tasks" element={<CreateTasks />} /> 
        <Route path="calendar" element={<Calendar />} />
        <Route path="audit-trail" element={<AuditTrail />} />
        <Route path="AdminStaffList" element={<AdminStaffList />} />
        <Route path="staff/:id" element={<AdminStaffProfile />} />
        <Route path="reports" element={<Reports />} />

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
