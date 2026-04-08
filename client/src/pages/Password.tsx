import { useState } from "react";
import { api } from "../api";

export default function Password() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    const { ok: success, data } = await api<{ error?: string }>("/api/auth/password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!success) {
      setError((data as { error?: string }).error ?? "Something went wrong.");
      return;
    }
    setOk(true);
    setCurrentPassword("");
    setNewPassword("");
  }

  return (
    <div>
      <h1>Change password</h1>
      <div className="card" style={{ maxWidth: 440 }}>
        <p className="muted">
          You must enter your current password. New passwords cannot reuse old ones and must meet complexity rules.
          Password can only be changed after it has been in use for at least one day.
        </p>
        {error && <div className="msg msg-error">{error}</div>}
        {ok && <div className="msg msg-info">Password updated.</div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="cur">Current password</label>
            <input
              id="cur"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="nw">New password</label>
            <input
              id="nw"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
