import { useEffect, useState } from "react";
import type { ApiError } from "../../api/http";
import { getStaff, type StaffProfile } from "../../api/staff";

export default function AdminDashboard() {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const rows = await getStaff();
        if (!alive) return;

        setStaff(rows);
      } catch (e) {
        if (!alive) return;
        setError(e as ApiError);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Staff</h2>
        <p style={{ margin: "6px 0 0", opacity: 0.8 }}>
          Loaded from backend via <code>/api/staff</code>. Hover cards to test responsiveness.
        </p>
      </div>

      {/* LOADING */}
      {loading && (
        <div style={{ opacity: 0.85, padding: "10px 0" }}>
          Loading staff…
        </div>
      )}

      {/* ERROR (LOUD) */}
      {error && (
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255, 0, 0, 0.08)",
            padding: 12,
            borderRadius: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>
            Unauthorized / Error fetching staff 😡
          </div>
          <div style={{ opacity: 0.9 }}>
            <div>
              <strong>Status:</strong> {error.status}
            </div>
            <div>
              <strong>Message:</strong> {error.message}
            </div>
          </div>
          <div style={{ marginTop: 10, opacity: 0.85 }}>
            Quick checks:
            <ul style={{ margin: "6px 0 0 18px" }}>
              <li>Are you logged in as an <strong>admin</strong>?</li>
              <li>Does <code>GET /api/me</code> show <code>app_role=admin</code> (or <code>db_role=admin</code>)?</li>
              <li>Does Supabase RLS allow admin to read <code>profiles</code>?</li>
            </ul>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && staff.length === 0 && (
        <div style={{ opacity: 0.85 }}>
          No staff found (profiles.role = <code>staff</code>).
        </div>
      )}

      {/* GRID */}
      <div className="adm-grid">
        {staff.map((s) => {
          const name =
            (s.full_name && s.full_name.trim()) ||
            `Staff ${s.id.slice(0, 8)}…`;

          return (
            <div
              key={s.id}
              className="adm-card"
              onClick={() => {
                // intentionally does nothing for now
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  // intentionally does nothing for now
                }
              }}
              aria-label={`Staff card: ${name}`}
            >
              <div className="adm-card__title">{name}</div>
              <div className="adm-card__sub">Library Staff</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
