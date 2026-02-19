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

      await signIn(cleanEmail, password);
      const role = await getMyRole();

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
    <div className="login-container">
      <div className="login-card">

        {/* Branding */}
        <div className="login-brand">
          <div className="school">Mapúa University</div>
          <h1 className="title">Cardinal LibTask</h1>
          <div className="login-accent" />
        </div>

        <form onSubmit={onSubmit}>

          <label className="login-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="login-input"
            type="email"
            placeholder="name@mapua.edu.ph"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <label className="login-label" htmlFor="password">
            Password
          </label>

          <div className="pw-wrap">
            <input
              id="password"
              className="login-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {errorMsg && (
            <div className="login-error">
              {errorMsg}
            </div>
          )}

          <button
            className="login-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="login-footer">
            Need access? Contact the librarian/admin to assign your role.
          </div>

        </form>
      </div>
    </div>
  );
}
