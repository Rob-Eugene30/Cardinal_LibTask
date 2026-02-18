import { Outlet } from "react-router-dom";

export default function StaffLayout() {
  return (
    <div style={{ padding: 16 }}>
      <Outlet />
    </div>
  );
}
