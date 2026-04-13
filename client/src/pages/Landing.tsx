import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Landing() {
  const { user } = useAuth();
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const n = sessionStorage.getItem("loginNotice");
    if (n) {
      setNotice(n);
      sessionStorage.removeItem("loginNotice");
    }
  }, []);

  // If user is authenticated, show dashboard content
  if (user) {
    return (
      <div>
        <h1>Dashboard</h1>
        {notice && <div className="card msg msg-info">{notice}</div>}
        <div className="card">
          <p>
            Signed in as <strong>{user.email}</strong> ({user.role.replace("_", " ")}).
          </p>
          <ul className="muted">
            {user.role === "ADMIN" && (
              <>
                <li>
                  <Link to="/admin/users">Manage administrators and product managers</Link>
                </li>
                <li>
                  <Link to="/admin/logs">View audit logs</Link>
                </li>
              </>
            )}
            {(user.role === "PRODUCT_MANAGER" || user.role === "ADMIN") && (
              <li>
                <Link to="/products">Products</Link> — catalog (managers edit; admins read-only in UI)
              </li>
            )}
            <li>
              <Link to="/orders">Orders</Link> — customers manage their own; managers see all.
            </li>
            <li>
              <Link to="/password">Change password</Link> (requires current password; one-day minimum age applies).
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // Public landing page for unauthenticated users
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