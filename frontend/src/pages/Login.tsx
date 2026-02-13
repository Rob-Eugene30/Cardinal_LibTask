import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyRole, signIn } from "../lib/auth";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setErrorMsg("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      // 1) Login (stores token)
      await signIn(cleanEmail, password);

      // 2) Resolve role via /api/me (should return db_role)
      const role = await getMyRole();

      // 3) Route by role
      if (role === "admin") navigate("/admin", { replace: true });
      else if (role === "staff") navigate("/staff", { replace: true });
      else setErrorMsg("Your account does not have an assigned role.");
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.response?.data?.detail ||
        "Login failed. Please check your credentials and try again.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card" role="main" aria-label="Login">
        <div className="login-brand">
          <div className="login-logo" aria-hidden="true">
            CL
          </div>
          <div>
            <div className="login-title">Cardinal LibTask</div>
            <div className="login-subtitle">Sign in to continue</div>
          </div>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <div className="login-field">
            <label className="login-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="login-input"
              type="email"
              autoComplete="email"
              placeholder="name@mapua.edu.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="login-input"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {errorMsg && (
            <div className="login-error" role="alert">
              {errorMsg}
            </div>
          )}

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="login-footnote">
            <span>Need access?</span>{" "}
            <span className="login-footnote-dim">
              Contact the librarian/admin to assign your role.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
