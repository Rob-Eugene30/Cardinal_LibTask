import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMyRole } from "../lib/auth";

export default function RequireRole({
  role,
  children,
}: {
  role: "admin" | "staff";
  children: JSX.Element;
}) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkRole() {
      const userRole = await getMyRole();
      setAllowed(userRole === role);
    }
    checkRole();
  }, [role]);

  if (allowed === null) return null; // loading
  if (!allowed) return <Navigate to="/login" replace />;

  return children;
}
