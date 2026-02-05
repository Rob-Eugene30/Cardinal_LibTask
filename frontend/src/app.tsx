import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminRoutes from "./routes/AdminRoutes";
import StaffRoutes from "./routes/StaffRoutes";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/staff/*" element={<StaffRoutes />} />
    </Routes>
  );
}
