import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-brand">
          <div className="school">MAPÚA UNIVERSITY</div>
          <h1 className="title">Cardinal LibTask</h1>
          <div className="login-accent" />
        </div>

        <label className="login-label">Email</label>
        <input className="login-input" placeholder="yourname@domain.com" />

        <label className="login-label">Password</label>
        <div className="pw-wrap">
          <input
            className="login-input"
            type={show ? "text" : "password"}
            placeholder="••••••••"
          />
          <button
            className="pw-eye"
            type="button"
            onClick={() => setShow(!show)}
            aria-label="Toggle password visibility"
          >
            {show ? "⌣" : "👁"}
          </button>
        </div>

        <div className="login-row">
          <a className="login-link" href="#">
            Forgot Password?
          </a>
          <a className="login-link" href="#">
            Help
          </a>
        </div>

        <div className="role-grid">
          <button
            className="login-btn admin-btn"
            type="button"
            onClick={() => navigate("/admin/dashboard")}
          >
            Login as Admin
          </button>

          <button
            className="login-btn staff-btn"
            type="button"
            onClick={() => navigate("/staff/dashboard")}
          >
            Login as Staff
          </button>
        </div>

        <div className="login-footer">© 2026 Cardinal LibTask</div>
      </div>
    </div>
  );
}
