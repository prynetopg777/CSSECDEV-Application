import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { Role } from "../api";

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="btn btn-ghost">
      {children}
    </Link>
  );
}

export function Layout({ allowed }: { allowed?: Role[] }) {
  const { user, logout } = useAuth();

  if (!user) return <Outlet />;

  if (allowed && !allowed.includes(user.role)) {
    return (
      <div className="app-shell">
        <div className="card msg msg-error">You do not have permission to view this page.</div>
        <Link to="/">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="nav">
        <NavLink to="/">Home</NavLink>
        {user.role === "ADMIN" && (
          <>
            <NavLink to="/admin/users">Users</NavLink>
            <NavLink to="/admin/logs">Audit logs</NavLink>
          </>
        )}
        {(user.role === "PRODUCT_MANAGER" || user.role === "ADMIN") && (
          <NavLink to="/products">Products</NavLink>
        )}
        <NavLink to="/orders">Orders</NavLink>
        <NavLink to="/password">Change password</NavLink>
        <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
          Log out
        </button>
        <span className="muted" style={{ marginLeft: "auto" }}>
          {user.email} · {user.role.replace("_", " ")}
        </span>
      </header>
      <Outlet />
    </div>
  );
}
