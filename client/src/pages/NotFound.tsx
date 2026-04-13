import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="app-shell">
      <div className="card">
        <h1>Page not found</h1>
        <p className="muted">The page you requested does not exist.</p>
        <Link to="/dashboard">Go home</Link>
      </div>
    </div>
  );
}
