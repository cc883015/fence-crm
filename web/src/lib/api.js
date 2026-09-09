const TOKEN_KEY = "nova_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function j(method, path, body, auth = false) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch("/api" + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && auth) {
    setToken("");
    throw new Error("unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `${method} ${path} → ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (username, password) => j("POST", "/auth/login", { username, password }),
  me: () => j("GET", "/auth/me", null, true),
  products: () => j("GET", "/products"),
  submitLead: (d) => j("POST", "/leads", d),
  customers: (deposit) =>
    j("GET", `/customers${deposit && deposit !== "all" ? `?deposit=${deposit}` : ""}`, null, true),
  customer: (id) => j("GET", `/customers/${id}`, null, true),
  createCustomer: (d) => j("POST", "/customers", d, true),
  updateCustomer: (id, d) => j("PUT", `/customers/${id}`, d, true),
  deleteCustomer: (id) => j("DELETE", `/customers/${id}`, null, true),
  createPayment: (d) => j("POST", "/payments", d, true),
  summary: () => j("GET", "/reports/summary", null, true),
  quickQuotes: () => j("GET", "/quick-quotes", null, true),
  quickQuote: (id) => j("GET", `/quick-quotes/${encodeURIComponent(id)}`, null, true),
  saveQuickQuote: (d) => j("POST", "/quick-quotes", d, true),
  deleteQuickQuote: (id) => j("DELETE", `/quick-quotes/${encodeURIComponent(id)}`, null, true),
};
