import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const n = sessionStorage.getItem("loginNotice");
    if (n) {
      setNotice(n);
      sessionStorage.removeItem("loginNotice");
    }
  }, []);

  if (!user) return null;

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
