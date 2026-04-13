import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function loadSecurityQuestion(emailValue: string) {
    if (!emailValue) {
      setSecurityQuestion("");
      setQuestionError(null);
      return;
    }

    setQuestionError(null);
    setQuestionLoading(true);
    const { ok, data } = await api<{ securityQuestion?: string; error?: string }>(
      `/api/auth/security-question?email=${encodeURIComponent(emailValue)}`
    );
    setQuestionLoading(false);

    if (!ok || !data.securityQuestion) {
      setSecurityQuestion("");
      setQuestionError("Unable to load security question for this email.");
      return;
    }

    setSecurityQuestion(data.securityQuestion);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { ok, data } = await api<{ error?: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, securityAnswer, newPassword }),
    });
    if (!ok) {
      setError((data as { error?: string }).error ?? "Invalid username and/or password.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="app-shell">
        <div className="card msg msg-info" style={{ maxWidth: 420 }}>
          Password updated. <Link to="/login">Sign in</Link> with your new password.
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 420 }}>
        <h1>Reset password</h1>
        <p className="muted">Use the security answer you set at registration.</p>
        {error && <div className="msg msg-error">{error}</div>}
        {questionError && <div className="msg msg-error">{questionError}</div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => void loadSecurityQuestion(email)}
              required
            />
          </div>
          {questionLoading && <div className="muted">Loading security question…</div>}
          {securityQuestion && (
            <div className="field">
              <label>Security question</label>
              <div className="card card-inline">{securityQuestion}</div>
            </div>
          )}
          <div className="field">
            <label htmlFor="sa">Security answer</label>
            <input
              id="sa"
              type="password"
              autoComplete="off"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="np">New password</label>
            <input
              id="np"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Reset password
          </button>
        </form>
        <p className="muted" style={{ marginTop: "1rem" }}>
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
