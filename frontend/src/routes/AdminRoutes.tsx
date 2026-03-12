import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "../components/layout/AdminLayout";
import AdminStaffList from "../pages/admin/AdminStaffList";
import AdminStaffProfile from "../pages/admin/AdminStaffProfile";
import AuditTrail from "../pages/admin/AuditTrail";
import Calendar from "../pages/admin/Calendar";
import CreateTasks from "../pages/admin/CreateTasks";
import Dashboard from "../pages/admin/Dashboard";
import Reports from "../pages/admin/Reports";
import Tags from "../pages/admin/Tags";
import Tasks from "../pages/admin/Tasks";
import TasksDetail from "../pages/admin/TasksDetail";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="tasks/:taskId" element={<TasksDetail />} />
        <Route path="create-tasks" element={<CreateTasks />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="audit-trail" element={<AuditTrail />} />
        <Route path="AdminStaffList" element={<AdminStaffList />} />
        <Route path="staff/:id" element={<AdminStaffProfile />} />
        <Route path="reports" element={<Reports />} />
        <Route path="tags" element={<Tags />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
