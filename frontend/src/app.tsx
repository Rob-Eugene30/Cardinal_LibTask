import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import RequireRole from "./components/RequireRole";

import AdminRoutes from "./routes/AdminRoutes";
import StaffRoutes from "./routes/StaffRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Admin area */}
        <Route
          path="/admin/*"
          element={
            <RequireRole role="admin">
              <AdminRoutes />
            </RequireRole>
          }
        />

        {/* Staff area */}
        <Route
          path="/staff/*"
          element={
            <RequireRole role="staff">
              <StaffRoutes />
            </RequireRole>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
