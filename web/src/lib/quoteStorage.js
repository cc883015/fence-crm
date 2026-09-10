import { api } from "./api.js";
import { fenceTypeLabel, summarizeQuote } from "./quoteModel.js";

const KEY = "nova_quick_quotes_v1";

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function toHistoryRow(quote) {
  const sum = summarizeQuote(quote);
  return {
    quoteId: quote.quoteId,
    date: quote.date,
    customerName: quote.customerName,
    fenceType: fenceTypeLabel(quote),
    total: sum.total,
    subtotal: sum.subtotal,
    gst: sum.gst,
    discount: sum.discount,
    adjustment: sum.adjustment,
    status: quote.status || "saved",
    payload: quote,
    updatedAt: new Date().toISOString(),
  };
}

export function listLocalQuotes() {
  return readAll()
    .map((r) => ({ ...r, ...(r.payload ? {} : {}) }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.quoteId).localeCompare(String(a.quoteId)));
}

export function getLocalQuote(quoteId) {
  const row = readAll().find((r) => r.quoteId === quoteId);
  return row?.payload || null;
}

export function upsertLocalQuote(quote) {
  const row = toHistoryRow(quote);
  const list = readAll().filter((r) => r.quoteId !== quote.quoteId);
  list.unshift(row);
  writeAll(list);
  return row;
}

export function deleteLocalQuote(quoteId) {
  writeAll(readAll().filter((r) => r.quoteId !== quoteId));
}

export async function listQuotes() {
  try {
    const remote = await api.quickQuotes();
    if (Array.isArray(remote) && remote.length) {
      const mapped = remote.map(fromApiRow);
      writeAll(mergeLists(readAll(), mapped));
      return listLocalQuotes();
    }
  } catch {
    /* offline / no D1 — local only */
  }
  return listLocalQuotes();
}

export async function saveQuoteRemote(quote) {
  const row = upsertLocalQuote(quote);
  try {
    const saved = await api.saveQuickQuote({
      quote_id: quote.quoteId,
      customer_name: quote.customerName,
      fence_type: row.fenceType,
      payload: quote,
      subtotal: row.subtotal,
      gst: row.gst,
      discount: row.discount,
      adjustment: row.adjustment,
      total: row.total,
      status: quote.status,
    });
    return { ...row, remote: true, id: saved.id };
  } catch {
    return { ...row, remote: false };
  }
}

export async function deleteQuoteRemote(quoteId) {
  deleteLocalQuote(quoteId);
  try {
    await api.deleteQuickQuote(quoteId);
  } catch {
    /* keep local delete */
  }
}

function fromApiRow(r) {
  const payload = typeof r.payload === "string" ? safeParse(r.payload) : (r.payload || {});
  return {
    quoteId: r.quote_id || payload.quoteId,
    date: r.created_at ? String(r.created_at).slice(0, 10) : payload.date,
    customerName: r.customer_name || payload.customerName,
    fenceType: r.fence_type || "",
    total: r.total,
    subtotal: r.subtotal,
    gst: r.gst,
    discount: r.discount,
    adjustment: r.adjustment,
    status: r.status || "saved",
    payload,
    updatedAt: r.updated_at,
  };
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}

function mergeLists(local, remote) {
  const map = new Map();
  [...local, ...remote].forEach((r) => {
    if (!r?.quoteId) return;
    const prev = map.get(r.quoteId);
    if (!prev || String(r.updatedAt || "") > String(prev.updatedAt || "")) map.set(r.quoteId, r);
  });
  return [...map.values()];
}
