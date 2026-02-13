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
      const role = await getMyRole();
      navigate(role === "admin" ? "/admin" : "/staff", { replace: true });
    } catch (ex: any) {
      setErr(ex?.message ?? String(ex));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
      <h1>Cardinal LibTask</h1>

      <form onSubmit={handleLogin} style={{ display: "grid", gap: 12 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />
        {err && <div style={{ color: "crimson" }}>{err}</div>}
        <button disabled={loading} type="submit">
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>
    </div>
  );
}
