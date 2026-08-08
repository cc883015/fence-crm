import React, { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { clearSavedCreds, getSavedCreds, setSavedCreds } from "../lib/api.js";

export default function Login() {
  const { login, isAdmin } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = getSavedCreds();
    if (!saved) return;
    setUsername(saved.username);
    setPassword(saved.password);
    setRemember(true);
  }, []);

  if (isAdmin) return <Navigate to="/admin" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await login(username, password);
      if (remember) setSavedCreds(username, password);
      else clearSavedCreds();
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
          <label htmlFor="login-user">Username · 账号</label>
          <input
            id="login-user"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="login-pass">Password · 密码</label>
          <input
            id="login-pass"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <label className="login-remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>记住账号密码（本机缓存，下次自动填入）</span>
        </label>
        {err && <p className="err">{err}</p>}
        <button className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }} disabled={busy}>
          {busy ? "Signing in…" : "Log in · 登录"}
        </button>
        <p className="muted login-hint">
          登录成功后会话也会保存在本机；退出后若勾选了「记住」，账号密码仍会填好方便再登。
        </p>
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          <Link to="/">← Back to website</Link>
        </p>
      </form>
    </div>
  );
}
