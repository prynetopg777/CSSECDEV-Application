import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api";

const securityQuestionOptions = [
  "What is your unique recovery phrase? (use random words)",
  "What is your private passphrase only you know?",
  "What is the name of your secret security phrase?",
  "Custom question...",
];

export default function Register() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState(securityQuestionOptions[0]);
  const [customQuestion, setCustomQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const question = securityQuestion === "Custom question..." ? customQuestion : securityQuestion;
    const { ok, data } = await api<{ error?: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        securityQuestion: question,
        securityAnswer,
      }),
    });
    if (!ok) {
      setError((data as { error?: string }).error ?? "Invalid input.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="app-shell">
        <div className="card msg msg-info" style={{ maxWidth: 420 }}>
          Registration successful. You can now <Link to="/login">sign in</Link>.
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 480 }}>
        <h1>Register (customer)</h1>
        <p className="muted">
          Use a long, unique security question and a random phrase as the answer (not guessable trivia).
        </p>
        {error && <div className="msg msg-error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="sq">Security question</label>
            <select
              id="sq"
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
            >
              {securityQuestionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          {securityQuestion === "Custom question..." && (
            <div className="field">
              <label htmlFor="custom-sq">Custom security question (min 20 characters)</label>
              <textarea
                id="custom-sq"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                required
                minLength={20}
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="sa">Security answer (min 10 characters)</label>
            <input
              id="sa"
              type="password"
              autoComplete="off"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              required
              minLength={10}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Register
          </button>
        </form>
        <p className="muted" style={{ marginTop: "1rem" }}>
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
