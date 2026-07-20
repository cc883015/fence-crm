import React, { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../lib/api.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getToken();
    if (!t) { setLoading(false); return; }
    api.me()
      .then((r) => setUser({ name: r.name }))
      .catch(() => { setToken(""); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const r = await api.login(username, password);
    setToken(r.token);
    setUser({ name: r.name });
    return r;
  };

  const logout = () => {
    setToken("");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, isAdmin: !!user }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
