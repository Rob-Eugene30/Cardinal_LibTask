import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, getMyRole } from "../lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      await signIn(email, password);

      const role = await getMyRole(); // now always returns "admin" or "staff"
      if (role === "admin") navigate("/admin/dashboard");
      else navigate("/staff/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-brand">
          <div className="school">Cardinal LibTask</div>
          <h1 className="title">Sign in</h1>
          <div className="login-accent" />
        </div>

        <form onSubmit={handleLogin}>
          <label className="login-label">Email</label>
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@libcal.com"
            autoComplete="email"
            required
          />

          <label className="login-label">Password</label>
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="admin123"
            autoComplete="current-password"
            required
          />

          {err && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(215,25,32,.18)",
                border: "1px solid rgba(215,25,32,.35)",
                color: "rgba(255,255,255,.92)",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              {err}
            </div>
          )}

          <button className="login-primary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="login-footer">
          Uses Supabase Auth + profiles.role to route admin/staff.
        </div>
      </div>
    </div>
  );
}
