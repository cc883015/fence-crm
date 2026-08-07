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
  appointments: (q = {}) => {
    const params = new URLSearchParams();
    if (q.weekday && q.weekday !== "all") params.set("weekday", q.weekday);
    if (q.status) params.set("status", q.status);
    const qs = params.toString();
    return j("GET", `/appointments${qs ? `?${qs}` : ""}`, null, true);
  },
  createAppointment: (d) => j("POST", "/appointments", d, true),
  updateAppointment: (id, d) => j("PUT", `/appointments/${id}`, d, true),
  deleteAppointment: (id) => j("DELETE", `/appointments/${id}`, null, true),
  inbox: (q = {}) => {
    const params = new URLSearchParams();
    if (q.status && q.status !== "all") params.set("status", q.status);
    const qs = params.toString();
    return j("GET", `/inbox${qs ? `?${qs}` : ""}`, null, true);
  },
  createInbox: (d) => j("POST", "/inbox", d, true),
  updateInbox: (id, d) => j("PUT", `/inbox/${id}`, d, true),
  deleteInbox: (id) => j("DELETE", `/inbox/${id}`, null, true),
  addInboxPhoto: (id, d) => j("POST", `/inbox/${id}/photos`, d, true),
  getInboxPhoto: (id, photoId) => j("GET", `/inbox/${id}/photos/${photoId}`, null, true),
  deleteInboxPhoto: (id, photoId) => j("DELETE", `/inbox/${id}/photos/${photoId}`, null, true),
  inboxLogs: (limit = 40) => j("GET", `/inbox/logs?limit=${limit}`, null, true),
};
