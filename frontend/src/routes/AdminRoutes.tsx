import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "../pages/admin/Dashboard";
import Tasks from "../pages/admin/Tasks";
import CreateTasks from "../pages/admin/CreateTasks";

export default function AdminRoutes() {
  return (
    <Routes>
      {/* default */}
      <Route path="/" element={<Navigate to="dashboard" replace />} />

      {/* admin pages */}
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="tasks" element={<Tasks />} />
      <Route path="create-tasks" element={<CreateTasks />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
