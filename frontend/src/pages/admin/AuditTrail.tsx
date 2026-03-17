import { useEffect, useState } from "react";
import { apiGet } from "../../api/http";

type AuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: any;
  new_data: any;
  created_at: string;
};

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function AuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadLogs() {
    try {
      setLoading(true);
      const data = await apiGet<AuditLog[]>("/audit_logs");
      setLogs(data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Audit Trail</h2>

      {loading && <p>Loading audit logs...</p>}

      {error && (
        <p style={{ color: "red" }}>
          Error loading audit logs: {error}
        </p>
      )}

      {!loading && !error && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "1rem",
            }}
          >
            <thead>
              <tr style={{ background: "#f2f2f2" }}>
                <th style={th}>Time</th>
                <th style={th}>User</th>
                <th style={th}>Action</th>
                <th style={th}>Entity</th>
                <th style={th}>Entity ID</th>
              </tr>
            </thead>

            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "12px", textAlign: "center" }}>
                    No audit logs found.
                  </td>
                </tr>
              )}

              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={td}>{formatTime(log.created_at)}</td>
                  <td style={td}>{log.user_id ?? "-"}</td>
                  <td style={td}>{log.action}</td>
                  <td style={td}>{log.entity_type}</td>
                  <td style={td}>{log.entity_id ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px",
  borderBottom: "1px solid #ddd",
  fontWeight: 600,
};

const td: React.CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid #eee",
};