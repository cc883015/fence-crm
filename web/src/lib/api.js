const TOKEN_KEY = "nova_admin_token";
const CREDS_KEY = "nova_admin_saved_creds";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Persist login form values on this device (admin CRM convenience). */
export function getSavedCreds() {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      username: String(parsed.username || ""),
      password: String(parsed.password || ""),
    };
  } catch {
    return null;
  }
}

export function setSavedCreds(username, password) {
  localStorage.setItem(
    CREDS_KEY,
    JSON.stringify({
      username: String(username || ""),
      password: String(password || ""),
    })
  );
}

export function clearSavedCreds() {
  localStorage.removeItem(CREDS_KEY);
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
  quoteSummaries: (q = {}) => {
    const params = new URLSearchParams();
    if (q.lead_id) params.set("lead_id", q.lead_id);
    if (q.appointment_id) params.set("appointment_id", q.appointment_id);
    const qs = params.toString();
    return j("GET", `/quote-summaries${qs ? `?${qs}` : ""}`, null, true);
  },
  quoteSummary: (id) => j("GET", `/quote-summaries/${id}`, null, true),
  createQuoteSummary: (d) => j("POST", "/quote-summaries", d, true),
  updateQuoteSummary: (id, d) => j("PUT", `/quote-summaries/${id}`, d, true),
  deleteQuoteSummary: (id) => j("DELETE", `/quote-summaries/${id}`, null, true),
  quickQuotes: () => j("GET", "/quick-quotes", null, true),
  quickQuote: (id) => j("GET", `/quick-quotes/${encodeURIComponent(id)}`, null, true),
  saveQuickQuote: (d) => j("POST", "/quick-quotes", d, true),
  deleteQuickQuote: (id) => j("DELETE", `/quick-quotes/${encodeURIComponent(id)}`, null, true),
};
