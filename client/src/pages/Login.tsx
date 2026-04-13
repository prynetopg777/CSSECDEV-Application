import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const meta = await login(email, password);
      const lines: string[] = [];
      if (meta.lastSuccessfulLoginAt) {
        lines.push(`Previous successful login: ${new Date(meta.lastSuccessfulLoginAt).toLocaleString()}`);
      } else {
        lines.push("This is your first successful login (no prior successful login on record).");
      }
      if (meta.lastFailedLoginAt) {
        lines.push(`Last failed attempt: ${new Date(meta.lastFailedLoginAt).toLocaleString()}`);
      }
      sessionStorage.setItem("loginNotice", lines.join("\n"));
      nav("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid username and/or password.");
    }
  }

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 420 }}>
        <h1>Sign in</h1>
        {error && <div className="msg msg-error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Sign in
          </button>
        </form>
        <p className="muted" style={{ marginTop: "1rem" }}>
          <Link to="/register">Create customer account</Link>
          {" · "}
          <Link to="/reset-password">Reset password</Link>
        </p>
      </div>
    </div>
  );
}
