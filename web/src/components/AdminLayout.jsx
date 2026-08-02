import React from "react";
import { Link, NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="admin-shell"><p className="muted">Loading…</p></div>;
  if (!isAdmin) return <Navigate to="/login" replace />;
  return children;
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
          <NavLink className={({ isActive }) => (isActive ? "navlink on" : "navlink")} to="/admin" end>
            订单 Orders
          </NavLink>
          <NavLink className={({ isActive }) => (isActive ? "navlink on" : "navlink")} to="/admin/enquiries">
            新资讯 Enquiries
          </NavLink>
          <NavLink className={({ isActive }) => (isActive ? "navlink on" : "navlink")} to="/admin/appointments">
            量尺 Measure
          </NavLink>
          <NavLink className={({ isActive }) => (isActive ? "navlink on" : "navlink")} to="/admin/new">
            新客户 New
          </NavLink>
          <NavLink className={({ isActive }) => (isActive ? "navlink on" : "navlink")} to="/admin/reports">
            报表 Reports
          </NavLink>
          <Link className="navlink" to="/">官网</Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>退出</button>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
