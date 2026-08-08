import React from "react";
import { Link, NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="admin-shell"><p className="muted">Loading…</p></div>;
  if (!isAdmin) return <Navigate to="/login" replace />;
  return children;
}

function navClass(extra = "") {
  return ({ isActive }) =>
    ["navlink", extra, isActive ? "on" : ""].filter(Boolean).join(" ");
}

export default function AdminLayout() {
  const { logout } = useAuth();
  return (
    <div className="admin-shell">
      <nav className="admin-nav ts-glass">
        <Link to="/" className="brand">
          <span className="brand-mark">N</span>
          <span>NOVA CRM</span>
        </Link>
        <div className="admin-links">
          <NavLink className={navClass()} to="/admin/checklist">
            每日必查清单
          </NavLink>
          <NavLink className={navClass()} to="/admin/prices">
            常见产品报价参考
          </NavLink>
          <NavLink className={navClass("navlink-blue")} to="/admin/appointments">
            测量系统
          </NavLink>
          <NavLink className={navClass("navlink-alert")} to="/admin/inbox">
            来客跟进
          </NavLink>
          <Link className="navlink" to="/">官网</Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>退出</button>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
