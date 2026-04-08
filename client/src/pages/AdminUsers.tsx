import { useEffect, useState } from "react";
import { api, type Role } from "../api";

type Row = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  lockedUntil: string | null;
  failedLoginAttempts: number;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "PRODUCT_MANAGER">("PRODUCT_MANAGER");
  const [securityQuestion, setSecurityQuestion] = useState(
    "What is your unique recovery phrase? (use random words)"
  );
  const [securityAnswer, setSecurityAnswer] = useState("");

  async function load() {
    const { ok, data } = await api<{ users?: Row[]; error?: string }>("/api/admin/users");
    if (!ok) {
      setError((data as { error?: string }).error ?? "Failed to load users.");
      return;
    }
    setUsers(data.users ?? []);
    setError(null);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { ok, data } = await api<{ error?: string }>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        role,
        securityQuestion,
        securityAnswer,
      }),
    });
    if (!ok) {
      setError((data as { error?: string }).error ?? "Invalid input.");
      return;
    }
    setEmail("");
    setPassword("");
    setSecurityAnswer("");
    await load();
  }

  async function setUserRole(id: string, newRole: Role) {
    setError(null);
    const { ok, data } = await api<{ error?: string }>(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ role: newRole }),
    });
    if (!ok) {
      setError((data as { error?: string }).error ?? "Failed to update role.");
      return;
    }
    await load();
  }

  async function removeUser(id: string) {
    if (!confirm("Delete this user?")) return;
    setError(null);
    const { ok, data } = await api<{ error?: string }>(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!ok) {
      setError((data as { error?: string }).error ?? "Failed to delete.");
      return;
    }
    await load();
  }

  return (
    <div>
      <h1>User management</h1>
      {error && <div className="msg msg-error">{error}</div>}

      <div className="card">
        <h2>Create administrator or product manager</h2>
        <form onSubmit={createUser}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
              <option value="PRODUCT_MANAGER">Product manager</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div className="field">
            <label>Security question (min 20 chars)</label>
            <textarea
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              required
              minLength={20}
            />
          </div>
          <div className="field">
            <label>Security answer (min 10 chars)</label>
            <input
              type="password"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              required
              minLength={10}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Create user
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Accounts</h2>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Lock / attempts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => void setUserRole(u.id, e.target.value as Role)}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="PRODUCT_MANAGER">PRODUCT_MANAGER</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                  </select>
                </td>
                <td className="muted">
                  {u.lockedUntil && new Date(u.lockedUntil) > new Date()
                    ? `Locked until ${new Date(u.lockedUntil).toLocaleString()}`
                    : `Attempts: ${u.failedLoginAttempts}`}
                </td>
                <td>
                  <button type="button" className="btn btn-danger" onClick={() => void removeUser(u.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
