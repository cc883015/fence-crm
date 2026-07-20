import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, isAdmin } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAdmin) return <Navigate to="/admin" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await login(username, password);
      nav("/admin");
    } catch (ex) {
      setErr("账号或密码错误 · Invalid credentials");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card ts-glass" onSubmit={onSubmit}>
        <p className="ts-eyebrow">Admin · Sign in</p>
        <h1>NOVA FENCE</h1>
        <div className="field">
          <label>Username · 账号</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </div>
        <div className="field">
          <label>Password · 密码</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        {err && <p className="err">{err}</p>}
        <button className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }} disabled={busy}>
          {busy ? "Signing in…" : "Log in · 登录"}
        </button>
        <p className="muted" style={{ marginTop: "1rem" }}>
          <Link to="/">← Back to website</Link>
        </p>
      </form>
    </div>
  );
}
