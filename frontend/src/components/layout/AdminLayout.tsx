import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div style={{ padding: 16 }}>
      <Outlet />
    </div>
  );
}
