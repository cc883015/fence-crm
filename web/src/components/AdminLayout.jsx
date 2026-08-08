import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="admin-shell"><p className="muted">Loading…</p></div>;
  if (!isAdmin) return <Navigate to="/login" replace />;
  return children;
}

const INBOX_STATUS_LINKS = [
  { status: "new", zh: "新咨询" },
  { status: "quoted", zh: "已发报价" },
  { status: "deposit_paid", zh: "已付定金" },
  { status: "done", zh: "已完工" },
];

function currentNavLabel(pathname, inboxStatus) {
  if (pathname.startsWith("/admin/checklist")) return "每日必查清单";
  if (pathname.startsWith("/admin/prices")) return "常见产品报价参考";
  if (pathname.startsWith("/admin/appointments")) return "测量系统";
  if (pathname === "/admin/inbox") {
    const hit = INBOX_STATUS_LINKS.find((s) => s.status === inboxStatus);
    return hit ? `来客跟进 · ${hit.zh}` : "来客跟进";
  }
  if (pathname.startsWith("/admin")) return "后台";
  return "菜单";
}

export default function AdminLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const inboxStatus = new URLSearchParams(location.search).get("status");
  const onInbox = location.pathname === "/admin/inbox";
  const menuLabel = currentNavLabel(location.pathname, inboxStatus);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  const linkClass = (on) => `navlink${on ? " on" : ""}`;

  return (
    <div className="admin-shell">
      <nav className="admin-nav ts-glass">
        <Link to="/" className="brand" aria-label="NOVA FENCE">
          <img
            className="brand-logo brand-logo-admin"
            src="/nova-fence-logo.png"
            alt="NOVA FENCE"
            width="200"
            height="44"
          />
        </Link>

        <button
          type="button"
          className={`admin-menu-toggle${menuOpen ? " is-open" : ""}`}
          aria-expanded={menuOpen}
          aria-controls="admin-nav-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="admin-menu-toggle-label">{menuLabel}</span>
          <span className="admin-menu-caret" aria-hidden>▾</span>
        </button>

        <div
          id="admin-nav-menu"
          className={`admin-links${menuOpen ? " is-open" : ""}`}
        >
          <NavLink
            className={({ isActive }) => linkClass(isActive)}
            to="/admin/checklist"
          >
            每日必查清单
          </NavLink>
          <NavLink
            className={({ isActive }) => linkClass(isActive)}
            to="/admin/prices"
          >
            常见产品报价参考
          </NavLink>
          <NavLink
            className={({ isActive }) => `navlink navlink-blue${isActive ? " on" : ""}`}
            to="/admin/appointments"
          >
            测量系统
          </NavLink>
          <NavLink
            className={() => `navlink navlink-alert${onInbox && !inboxStatus ? " on" : ""}`}
            to="/admin/inbox"
            end
          >
            来客跟进
          </NavLink>
          {INBOX_STATUS_LINKS.map((s) => (
            <NavLink
              key={s.status}
              className={() => linkClass(onInbox && inboxStatus === s.status)}
              to={`/admin/inbox?status=${s.status}`}
            >
              {s.zh}
            </NavLink>
          ))}
          <Link className="navlink" to="/">官网</Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>退出</button>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
