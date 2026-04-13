import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="app-shell">
      <div className="card">
        <h1>Welcome to Secure Web App</h1>
        <p>
          This is a demonstration of secure web application development practices,
          implementing comprehensive authentication, authorization, and data validation.
        </p>
        <div style={{ margin: "2rem 0" }}>
          <Link to="/login" className="btn btn-primary" style={{ marginRight: "1rem" }}>
            Sign In
          </Link>
          <Link to="/register" className="btn btn-secondary">
            Create Account
          </Link>
        </div>
        <div className="muted">
          <h3>Features</h3>
          <ul>
            <li>Secure user authentication with password policies</li>
            <li>Role-based access control (Admin, Product Manager, Customer)</li>
            <li>Comprehensive audit logging</li>
            <li>Input validation and sanitization</li>
            <li>Account security measures (lockout, password history)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}