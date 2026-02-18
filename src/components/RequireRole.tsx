import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMyRole } from "../lib/auth";

export default function RequireRole({
  role,
  children,
}: {
  role: "admin" | "staff";
  children: ReactElement;
}) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const userRole = await getMyRole();
        // admin can access staff routes
        const ok = userRole === role || (role === "staff" && userRole === "admin");
        setAllowed(ok);
      } catch {
        setAllowed(false);
      }
    })();
  }, [role]);

  if (allowed === null) return <div style={{ padding: 16 }}>Checking access…</div>;
  if (!allowed) return <Navigate to="/login" replace />;

  return children;
}
