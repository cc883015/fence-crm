import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();
app.use("/api/*", cors());

const ADMIN_USER = "NOVAFENCE";
const ADMIN_PASS = "novafence123";
const ADMIN_TOKEN = "nova-fence-admin-token-v1";

function isAuthed(c) {
  const h = c.req.header("Authorization") || "";
  return h === `Bearer ${ADMIN_TOKEN}`;
}

async function requireAuth(c, next) {
  if (!isAuthed(c)) return c.json({ error: "unauthorized" }, 401);
  return next();
}

function safeJson(s, fallback = []) {
  try { return JSON.parse(s); } catch { return fallback; }
}

function customerSelectSQL(where = "") {
  return `
    SELECT c.*,
      (SELECT COUNT(*) FROM payments p WHERE p.customer_id=c.id AND p.type='deposit' AND p.status='paid') AS has_deposit,
      (SELECT COUNT(*) FROM payments p WHERE p.customer_id=c.id AND p.type='full' AND p.status='paid') AS has_full,
      (SELECT total FROM quotes q WHERE q.customer_id=c.id ORDER BY q.id DESC LIMIT 1) AS latest_quote
    FROM customers c
    ${where}
    ORDER BY c.updated_at DESC
  `;
}

function mapCustomer(r) {
  return {
    ...r,
    has_deposit: r.has_deposit > 0,
    has_full: r.has_full > 0,
    intake_answers: safeJson(r.intake_answers, {}),
    gate_required: !!r.gate_required,
    dual_estimate: !!r.dual_estimate,
    deposit_informed: !!r.deposit_informed,
  };
}

// ─── Health ─────────────────────────────────
app.get("/api/health", (c) => c.json({ ok: true, ts: Date.now() }));

// ─── Auth ───────────────────────────────────
app.post("/api/auth/login", async (c) => {
  const b = await c.req.json();
  const user = (b.username || "").trim();
  const pass = (b.password || "").trim();
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return c.json({ ok: true, token: ADMIN_TOKEN, name: "NOVA Admin" });
  }
  return c.json({ error: "invalid credentials" }, 401);
});

app.get("/api/auth/me", (c) => {
  if (!isAuthed(c)) return c.json({ ok: false }, 401);
  return c.json({ ok: true, name: "NOVA Admin" });
});

// ─── Products (public) ──────────────────────
app.get("/api/products", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM products WHERE active=1 ORDER BY id"
  ).all();
  return c.json(results.map((p) => ({ ...p, features: safeJson(p.features) })));
});

// ─── Leads (public website) ─────────────────
app.post("/api/leads", async (c) => {
  const b = await c.req.json();
  const phone = (b.phone || "").trim();
  const email = (b.email || "").trim();
  const style = b.fence_type || b.fence_style || "";
  const gate = (b.gate_required || b.automatic_gate) ? 1 : 0;
  const answers = {
    channel: "website",
    message: b.message || "",
    fence_type: style,
    color: b.color || "",
    fence_length: b.fence_length || "",
    suburb: b.suburb || "",
    automatic_gate: !!gate,
    submitted_at: new Date().toISOString(),
  };
  const noteLine = b.message ? `Website message: ${b.message}` : "";

  let customer = null;
  if (phone || email) {
    customer = await c.env.DB.prepare(
      "SELECT * FROM customers WHERE (phone!='' AND phone=?1) OR (email!='' AND email=?2) LIMIT 1"
    ).bind(phone, email).first();
  }

  let customerId, intake;
  if (customer) {
    customerId = customer.id;
    intake = "duplicate";
    const mergedNotes = [customer.notes, noteLine].filter(Boolean).join("\n");
    // Keep pipeline stage; if they were only an unread website enquiry, refresh fields
    const keepEnquiry = customer.stage === "enquiry";
    await c.env.DB.prepare(
      `UPDATE customers SET
        name=COALESCE(NULLIF(?1,''),name),
        email=COALESCE(NULLIF(?2,''),email),
        suburb=COALESCE(NULLIF(?3,''),suburb),
        service_area=COALESCE(NULLIF(?4,''), service_area),
        fence_length=COALESCE(NULLIF(?5,''), fence_length),
        fence_style=COALESCE(NULLIF(?6,''), fence_style),
        gate_required=?7,
        color=COALESCE(NULLIF(?8,''), color),
        notes=COALESCE(NULLIF(?9,''), notes),
        intake_answers=?10,
        stage=CASE WHEN ?11=1 THEN 'enquiry' ELSE stage END,
        updated_at=datetime('now') WHERE id=?12`
    ).bind(
      b.name || "", email, b.suburb || "", b.suburb || b.service_area || "",
      b.fence_length || "", style, gate, b.color || "",
      mergedNotes, JSON.stringify({ ...answers, email }),
      keepEnquiry ? 1 : 0, customerId
    ).run();
  } else {
    const res = await c.env.DB.prepare(
      `INSERT INTO customers
        (name, phone, email, suburb, stage, source, service_area, fence_length, fence_style, gate_required, color, notes, install_type, slope, intake_answers)
       VALUES (?1,?2,?3,?4,'enquiry','website',?5,?6,?7,?8,?9,?10,?11,?12,?13)`
    ).bind(
      b.name || "", phone, email, b.suburb || "",
      b.suburb || b.service_area || "",
      b.fence_length || "", style, gate, b.color || "",
      noteLine,
      b.brick_wall ? "brick" : (b.install_type || ""),
      b.slope || "unknown",
      JSON.stringify({ ...answers, email })
    ).run();
    customerId = res.meta.last_row_id;
    intake = "new";
  }

  await c.env.DB.prepare(
    `INSERT INTO leads (customer_id, source, intake_status, raw_name, raw_phone, raw_email,
      suburb, fence_length, fence_height, fence_type, gate_required, automatic_gate,
      brick_wall, slope, budget, timeline, photos, message)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)`
  ).bind(
    customerId, b.source || "website", intake, b.name || "", phone, email,
    b.suburb || "", b.fence_length || "", b.fence_height || "", style,
    gate, gate, b.brick_wall ? 1 : 0,
    b.slope || "unknown", b.budget || "", b.timeline || "",
    JSON.stringify(b.photos || []), b.message || ""
  ).run();

  const summary = [
    `官网报价提交 (${intake})`,
    b.name && `Name: ${b.name}`,
    phone && `Phone: ${phone}`,
    email && `Email: ${email}`,
    b.suburb && `Suburb: ${b.suburb}`,
    b.fence_length && `Length: ${b.fence_length}`,
    style && `Style: ${style}`,
    b.color && `Colour: ${b.color}`,
    `Gate: ${gate ? "Yes" : "No"}`,
    b.message && `Msg: ${b.message}`,
  ].filter(Boolean).join(" · ");

  await c.env.DB.prepare(
    "INSERT INTO activities (customer_id, type, content) VALUES (?1,'message',?2)"
  ).bind(customerId, summary).run();

  return c.json({ ok: true, customer_id: customerId, intake_status: intake });
});

// ─── Protected admin APIs ───────────────────
app.use("/api/customers/*", requireAuth);
app.use("/api/customers", requireAuth);
app.use("/api/payments", requireAuth);
app.use("/api/payments/*", requireAuth);
app.use("/api/reports/*", requireAuth);
app.use("/api/appointments/*", requireAuth);
app.use("/api/appointments", requireAuth);
app.use("/api/inbox/*", requireAuth);
app.use("/api/inbox", requireAuth);
app.use("/api/leads", async (c, next) => {
  if (c.req.method === "GET") return requireAuth(c, next);
  return next();
});

app.get("/api/leads", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM leads ORDER BY created_at DESC LIMIT 200"
  ).all();
  return c.json(results);
});

app.get("/api/customers", async (c) => {
  const deposit = c.req.query("deposit"); // none | paid | full | all
  let where = "";
  if (deposit === "none") {
    where = `WHERE c.stage!='lost'
      AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.customer_id=c.id AND p.type='deposit' AND p.status='paid')
      AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.customer_id=c.id AND p.type='full' AND p.status='paid')`;
  } else if (deposit === "paid") {
    where = `WHERE EXISTS (SELECT 1 FROM payments p WHERE p.customer_id=c.id AND p.type='deposit' AND p.status='paid')
      AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.customer_id=c.id AND p.type='full' AND p.status='paid')`;
  } else if (deposit === "full") {
    where = `WHERE EXISTS (SELECT 1 FROM payments p WHERE p.customer_id=c.id AND p.type='full' AND p.status='paid')`;
  }
  const { results } = await c.env.DB.prepare(customerSelectSQL(where)).all();
  return c.json(results.map(mapCustomer));
});

app.get("/api/customers/:id", async (c) => {
  const id = c.req.param("id");
  const row = await c.env.DB.prepare(customerSelectSQL("WHERE c.id=?1")).bind(id).first();
  if (!row) return c.json({ error: "not found" }, 404);
  const quotes = (await c.env.DB.prepare("SELECT * FROM quotes WHERE customer_id=?1 ORDER BY id DESC").bind(id).all()).results;
  const payments = (await c.env.DB.prepare("SELECT * FROM payments WHERE customer_id=?1 ORDER BY id DESC").bind(id).all()).results;
  const activities = (await c.env.DB.prepare("SELECT * FROM activities WHERE customer_id=?1 ORDER BY id DESC").bind(id).all()).results;
  return c.json({ ...mapCustomer(row), quotes, payments, activities });
});

app.post("/api/customers", async (c) => {
  const b = await c.req.json();
  const answers = b.intake_answers || {};
  const res = await c.env.DB.prepare(
    `INSERT INTO customers (
      name, phone, email, suburb, address, stage, notes, source,
      fence_length, gate_required, gate_width, install_type, fence_style, color,
      slope, dual_estimate, photo_note, deposit_informed, service_area, intake_answers
    ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20)`
  ).bind(
    b.name || "", b.phone || "", b.email || "", b.suburb || "", b.address || "",
    b.stage || "new", b.notes || "", b.source || "phone",
    b.fence_length || "", b.gate_required ? 1 : 0, b.gate_width || "",
    b.install_type || "", b.fence_style || "", b.color || "",
    b.slope || "unknown", b.dual_estimate ? 1 : 0, b.photo_note || "",
    b.deposit_informed ? 1 : 0, b.service_area || "",
    JSON.stringify(answers)
  ).run();
  const id = res.meta.last_row_id;
  await c.env.DB.prepare(
    "INSERT INTO activities (customer_id, type, content) VALUES (?1,'note',?2)"
  ).bind(id, `新客户录入 (${b.source || "phone"})`).run();
  return c.json({ ok: true, id });
});

app.put("/api/customers/:id", async (c) => {
  const id = c.req.param("id");
  const b = await c.req.json();
  const prev = await c.env.DB.prepare("SELECT * FROM customers WHERE id=?1").bind(id).first();
  if (!prev) return c.json({ error: "not found" }, 404);

  await c.env.DB.prepare(
    `UPDATE customers SET
      name=?1, phone=?2, email=?3, suburb=?4, address=?5, stage=?6, notes=?7, source=?8,
      fence_length=?9, gate_required=?10, gate_width=?11, install_type=?12, fence_style=?13,
      color=?14, slope=?15, dual_estimate=?16, photo_note=?17, deposit_informed=?18,
      service_area=?19, intake_answers=?20, updated_at=datetime('now')
     WHERE id=?21`
  ).bind(
    b.name || "", b.phone || "", b.email || "", b.suburb || "", b.address || "",
    b.stage || "new", b.notes || "", b.source || "",
    b.fence_length || "", b.gate_required ? 1 : 0, b.gate_width || "",
    b.install_type || "", b.fence_style || "", b.color || "",
    b.slope || "unknown", b.dual_estimate ? 1 : 0, b.photo_note || "",
    b.deposit_informed ? 1 : 0, b.service_area || "",
    JSON.stringify(b.intake_answers || safeJson(prev.intake_answers, {})), id
  ).run();

  // History: log field changes
  const watch = [
    ["stage", "阶段"],
    ["source", "来源"],
    ["service_area", "服务区"],
    ["fence_length", "长度"],
    ["gate_required", "电动门"],
    ["gate_width", "门宽"],
    ["install_type", "安装方式"],
    ["fence_style", "款式"],
    ["color", "颜色"],
    ["slope", "斜坡"],
    ["dual_estimate", "双估价"],
    ["photo_note", "照片备注"],
    ["deposit_informed", "定金说明"],
    ["name", "姓名"],
    ["phone", "电话"],
    ["email", "邮箱"],
    ["suburb", "Suburb"],
    ["notes", "备注"],
  ];
  const changes = [];
  for (const [key, label] of watch) {
    let oldV = prev[key];
    let newV = b[key];
    if (key === "gate_required" || key === "dual_estimate" || key === "deposit_informed") {
      oldV = prev[key] ? 1 : 0;
      newV = b[key] ? 1 : 0;
    }
    const o = oldV == null ? "" : String(oldV);
    const n = newV == null ? "" : String(newV);
    if (o !== n) changes.push(`${label}: ${o || "—"} → ${n || "—"}`);
  }
  if (changes.length) {
    await c.env.DB.prepare(
      "INSERT INTO activities (customer_id, type, content) VALUES (?1,'note',?2)"
    ).bind(id, `更新客户信息 · ${changes.join("; ")}`).run();
  }

  return c.json({ ok: true, changes: changes.length });
});

app.delete("/api/customers/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM customers WHERE id=?1").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

app.post("/api/payments", async (c) => {
  const b = await c.req.json();
  const res = await c.env.DB.prepare(
    `INSERT INTO payments (customer_id, quote_id, type, amount, method, status, paid_at)
     VALUES (?1,?2,?3,?4,?5,?6, CASE WHEN ?6='paid' THEN datetime('now') ELSE NULL END)`
  ).bind(b.customer_id, b.quote_id || null, b.type, b.amount, b.method || "payid", b.status || "pending").run();

  if (b.status === "paid" && b.type === "deposit") {
    await c.env.DB.prepare(
      "UPDATE customers SET stage='deposit_paid', updated_at=datetime('now') WHERE id=?1"
    ).bind(b.customer_id).run();
  }
  if (b.status === "paid" && b.type === "full") {
    await c.env.DB.prepare(
      "UPDATE customers SET stage='paid_full', updated_at=datetime('now') WHERE id=?1"
    ).bind(b.customer_id).run();
  }

  await c.env.DB.prepare(
    "INSERT INTO activities (customer_id, type, content) VALUES (?1,?2,?3)"
  ).bind(b.customer_id, b.type === "deposit" ? "deposit_paid" : "note", `${b.type} ${b.status} $${b.amount}`).run();
  return c.json({ ok: true, id: res.meta.last_row_id });
});

function googleMapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "")}`;
}

/**
 * HTTPS bridge page for WeChat / group chats.
 * maps:// alone is not clickable there; this https link is, then jumps into Apple Maps with the address.
 */
function appleMapsShareUrl(address, requestUrl) {
  let origin = "https://fence-crm.n12047805.workers.dev";
  try {
    origin = new URL(requestUrl).origin;
  } catch { /* keep default */ }
  return `${origin}/go/apple-maps?q=${encodeURIComponent(address || "")}`;
}

function weekdayFromDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const n = d.getDay(); // 0 Sun … 6 Sat
  if (n === 3) return "wed";
  if (n === 6) return "sat";
  return "";
}

function mapAppointment(row, requestUrl) {
  if (!row) return row;
  return {
    ...row,
    maps_url: googleMapsUrl(row.address),
    apple_maps_url: appleMapsShareUrl(row.address, requestUrl),
  };
}

/** Public bridge: clickable in WeChat → open Apple Maps app with address. */
app.get("/go/apple-maps", (c) => {
  const q = (c.req.query("q") || "").trim();
  const qEnc = encodeURIComponent(q);
  const mapsApp = `maps://?q=${qEnc}`;
  // Apple's documented http map link — on iOS this usually hands off to the Maps app
  const mapsHttp = `http://maps.apple.com/?q=${qEnc}`;
  const esc = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");

  return c.html(`<!DOCTYPE html>
<html lang="zh-Hans">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>打开苹果地图</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      background: #f4f6f8; color: #1a2744; padding: 1.5rem; text-align: center; }
    .card { background: #fff; border-radius: 1rem; padding: 1.5rem 1.25rem;
      max-width: 22rem; width: 100%; box-shadow: 0 8px 28px rgba(0,0,0,.08); }
    h1 { font-size: 1.15rem; margin: 0 0 .5rem; }
    p { margin: .35rem 0; color: #5a6578; font-size: .95rem; word-break: break-word; }
    .btn { display: block; margin-top: 1rem; padding: .9rem 1rem; border-radius: .75rem;
      background: #1a2744; color: #fff; text-decoration: none; font-weight: 700; }
    .btn.secondary { background: #e8ecf2; color: #1a2744; margin-top: .65rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>打开苹果地图</h1>
    <p>${q ? esc(q) : "未提供地址"}</p>
    <p style="font-size:.85rem">正在跳转到苹果地图 App…</p>
    <a class="btn" id="openApp" href="${mapsApp}">打开苹果地图 App</a>
    <a class="btn secondary" href="${mapsHttp}">若未跳转，点这里</a>
  </div>
  <script>
    (function () {
      var app = ${JSON.stringify(mapsApp)};
      var http = ${JSON.stringify(mapsHttp)};
      // Try native scheme first (opens Maps app with address filled in)
      window.location.href = app;
      setTimeout(function () {
        // Fallback: Apple http map link (still usually opens the app on iPhone)
        window.location.href = http;
      }, 600);
    })();
  </script>
</body>
</html>`);
});

app.get("/api/appointments", async (c) => {
  const weekday = c.req.query("weekday"); // wed | sat | all
  const status = c.req.query("status");
  const clauses = [];
  const binds = [];
  if (weekday === "wed" || weekday === "sat") {
    clauses.push(`weekday=?${binds.length + 1}`);
    binds.push(weekday);
  }
  if (status) {
    clauses.push(`status=?${binds.length + 1}`);
    binds.push(status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM measurement_appointments ${where} ORDER BY appointment_date ASC, appointment_time ASC, id DESC`
  ).bind(...binds).all();
  return c.json(results.map((row) => mapAppointment(row, c.req.url)));
});

app.get("/api/appointments/:id", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT * FROM measurement_appointments WHERE id=?1"
  ).bind(c.req.param("id")).first();
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json(mapAppointment(row, c.req.url));
});

app.post("/api/appointments", async (c) => {
  const b = await c.req.json();
  const name = (b.name || "").trim();
  const phone = (b.phone || "").trim();
  const address = (b.address || "").trim();
  const appointment_date = (b.appointment_date || "").trim();
  const appointment_time = (b.appointment_time || "").trim();
  const email = (b.email || "").trim();
  const notes = (b.notes || "").trim();
  const status = b.status === "completed" ? "completed" : "scheduled";
  if (!name || !phone || !address || !appointment_date) {
    return c.json({ error: "name, phone, address, appointment_date required" }, 400);
  }
  const weekday = weekdayFromDate(appointment_date);
  if (!weekday) {
    return c.json({ error: "appointment_date must be a Wednesday or Saturday" }, 400);
  }
  const res = await c.env.DB.prepare(
    `INSERT INTO measurement_appointments
      (name, phone, email, appointment_date, weekday, appointment_time, address, notes, status)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`
  ).bind(name, phone, email, appointment_date, weekday, appointment_time, address, notes, status).run();
  const row = await c.env.DB.prepare(
    "SELECT * FROM measurement_appointments WHERE id=?1"
  ).bind(res.meta.last_row_id).first();
  return c.json(mapAppointment(row, c.req.url));
});

app.put("/api/appointments/:id", async (c) => {
  const id = c.req.param("id");
  const prev = await c.env.DB.prepare(
    "SELECT * FROM measurement_appointments WHERE id=?1"
  ).bind(id).first();
  if (!prev) return c.json({ error: "not found" }, 404);
  const b = await c.req.json();
  const name = String(b.name ?? prev.name ?? "").trim();
  const phone = String(b.phone ?? prev.phone ?? "").trim();
  const address = String(b.address ?? prev.address ?? "").trim();
  const appointment_date = String(b.appointment_date ?? prev.appointment_date ?? "").trim();
  const appointment_time = String(b.appointment_time ?? prev.appointment_time ?? "").trim();
  const email = String(b.email ?? prev.email ?? "").trim();
  const notes = String(b.notes ?? prev.notes ?? "").trim();
  const status = String(b.status ?? prev.status ?? "scheduled").trim();
  const weekday = weekdayFromDate(appointment_date);
  if (!weekday) {
    return c.json({ error: "appointment_date must be a Wednesday or Saturday" }, 400);
  }
  await c.env.DB.prepare(
    `UPDATE measurement_appointments SET
      name=?1, phone=?2, email=?3, appointment_date=?4, weekday=?5,
      appointment_time=?6, address=?7, notes=?8, status=?9,
      updated_at=datetime('now')
     WHERE id=?10`
  ).bind(name, phone, email, appointment_date, weekday, appointment_time, address, notes, status, id).run();
  const row = await c.env.DB.prepare(
    "SELECT * FROM measurement_appointments WHERE id=?1"
  ).bind(id).first();
  return c.json(mapAppointment(row, c.req.url));
});

app.delete("/api/appointments/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM measurement_appointments WHERE id=?1").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

const INBOX_STATUSES = new Set([
  "new", "quoted", "deposit_paid", "done",
]);

/** Retired inbox statuses → still-visible bucket (rows are never deleted). */
const INBOX_STATUS_LEGACY = {
  style: "quoted",
  visit: "quoted",
  deposit_wait: "quoted",
};

function normalizeInboxStatus(status, fallback = "new") {
  if (INBOX_STATUSES.has(status)) return status;
  if (status && INBOX_STATUS_LEGACY[status]) return INBOX_STATUS_LEGACY[status];
  return fallback;
}

function photoMeta(leadId, p) {
  return {
    id: p.id,
    name: p.name || "",
    thumb: p.thumb || "",
  };
}

async function listPhotosForLead(db, leadId) {
  const { results } = await db.prepare(
    "SELECT id, name, thumb FROM lead_photos WHERE lead_id=?1 ORDER BY created_at ASC"
  ).bind(leadId).all();
  return results || [];
}

async function migrateLegacyPhotos(db, row) {
  const legacy = safeJson(row.photos, []);
  if (!legacy.length) return;
  const existing = await db.prepare(
    "SELECT COUNT(*) n FROM lead_photos WHERE lead_id=?1"
  ).bind(row.id).first();
  if (existing?.n > 0) return;
  for (const p of legacy) {
    if (!p?.id || !p?.dataUrl) continue;
    await db.prepare(
      `INSERT OR IGNORE INTO lead_photos (id, lead_id, name, thumb, data)
       VALUES (?1,?2,?3,?4,?5)`
    ).bind(p.id, row.id, p.name || "", p.thumb || p.dataUrl, p.dataUrl).run();
  }
  await db.prepare("UPDATE lead_inbox SET photos='[]' WHERE id=?1").bind(row.id).run();
}

async function mapInbox(db, row) {
  if (!row) return row;
  await migrateLegacyPhotos(db, row);
  const photos = await listPhotosForLead(db, row.id);
  const { photos: _drop, ...rest } = row;
  return { ...rest, photos };
}

function normalizeQuotation(q) {
  const s = String(q || "").trim();
  if (!s) return "";
  if (/^QU-/i.test(s)) return s.toUpperCase().replace(/^QU-/i, "QU-");
  return `QU-${s.replace(/^QU-/i, "")}`;
}

const INBOX_STATUS_LABEL = {
  new: "新咨询",
  quoted: "已发报价",
  deposit_paid: "已付定金",
  done: "已完工",
};

async function logInbox(db, { leadId = null, leadName = "", action, detail = "" }) {
  await db.prepare(
    `INSERT INTO lead_inbox_logs (lead_id, lead_name, action, detail)
     VALUES (?1,?2,?3,?4)`
  ).bind(leadId, String(leadName || "").slice(0, 120), action, String(detail || "").slice(0, 4000)).run();
}

const INBOX_FIELD_LABELS = {
  name: "姓名",
  phone: "电话",
  email: "邮箱",
  address: "地址",
  notes: "备注",
  quotation: "报价号",
  status: "状态",
  source: "来源",
};

function formatInboxValue(key, value) {
  const v = String(value ?? "").trim();
  if (!v) return "（空）";
  if (key === "status") return INBOX_STATUS_LABEL[v] || v;
  return v;
}

/** Full snapshot of a lead for create/delete audit lines. */
function inboxSnapshot(row, { photoNames = [] } = {}) {
  const parts = Object.entries(INBOX_FIELD_LABELS).map(([k, label]) => {
    return `${label}：${formatInboxValue(k, row[k])}`;
  });
  if (photoNames.length) {
    parts.push(`照片（${photoNames.length}）：${photoNames.join("、")}`);
  } else if (row._photoCount != null) {
    parts.push(`照片：${row._photoCount} 张`);
  }
  return parts.join("；");
}

function inboxFieldDiffs(prev, next) {
  const parts = [];
  for (const [k, label] of Object.entries(INBOX_FIELD_LABELS)) {
    const a = String(prev[k] ?? "").trim();
    const b = String(next[k] ?? "").trim();
    if (a === b) continue;
    parts.push(`${label} ${formatInboxValue(k, a)}→${formatInboxValue(k, b)}`);
  }
  return parts;
}

app.get("/api/inbox", async (c) => {
  const status = c.req.query("status");
  let sql = "SELECT id, name, phone, email, address, notes, quotation, status, source, photos, created_at, updated_at FROM lead_inbox";
  const binds = [];
  if (status && INBOX_STATUSES.has(status)) {
    sql += " WHERE status=?1";
    binds.push(status);
  }
  sql += " ORDER BY created_at ASC, id ASC";
  const { results } = await c.env.DB.prepare(sql).bind(...binds).all();
  const out = [];
  for (const row of results) {
    const mapped = await mapInbox(c.env.DB, row);
    // Surface remapped label if DB still has a retired status (no delete).
    mapped.status = normalizeInboxStatus(mapped.status, "new");
    out.push(mapped);
  }
  return c.json(out);
});

app.post("/api/inbox", async (c) => {
  const b = await c.req.json();
  const name = String(b.name || "").trim();
  if (!name) return c.json({ error: "name required" }, 400);
  const status = normalizeInboxStatus(b.status, "new");
  const res = await c.env.DB.prepare(
    `INSERT INTO lead_inbox
      (name, phone, email, address, notes, quotation, status, source, photos)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,'[]')`
  ).bind(
    name,
    String(b.phone || "").trim(),
    String(b.email || "").trim(),
    String(b.address || "").trim(),
    String(b.notes || "").trim(),
    normalizeQuotation(b.quotation),
    status,
    String(b.source || "").trim()
  ).run();
  const row = await c.env.DB.prepare(
    "SELECT id, name, phone, email, address, notes, quotation, status, source, photos, created_at, updated_at FROM lead_inbox WHERE id=?1"
  ).bind(res.meta.last_row_id).first();
  await logInbox(c.env.DB, {
    leadId: row.id,
    leadName: row.name,
    action: "create",
    detail: `新建来客 → ${inboxSnapshot(row)}`,
  });
  return c.json(await mapInbox(c.env.DB, row));
});

app.get("/api/inbox/logs", async (c) => {
  const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") || 40)));
  const { results } = await c.env.DB.prepare(
    `SELECT id, lead_id, lead_name, action, detail, created_at
     FROM lead_inbox_logs
     ORDER BY id DESC
     LIMIT ?1`
  ).bind(limit).all();
  return c.json(results || []);
});

app.put("/api/inbox/:id", async (c) => {
  const id = c.req.param("id");
  const prev = await c.env.DB.prepare("SELECT * FROM lead_inbox WHERE id=?1").bind(id).first();
  if (!prev) return c.json({ error: "not found" }, 404);
  const b = await c.req.json();
  const status = normalizeInboxStatus(
    b.status ?? prev.status,
    normalizeInboxStatus(prev.status, "new")
  );
  const next = {
    name: String(b.name ?? prev.name ?? "").trim() || prev.name,
    phone: String(b.phone ?? prev.phone ?? "").trim(),
    email: String(b.email ?? prev.email ?? "").trim(),
    address: String(b.address ?? prev.address ?? "").trim(),
    notes: String(b.notes ?? prev.notes ?? "").trim(),
    quotation: normalizeQuotation(b.quotation ?? prev.quotation),
    status,
    source: String(b.source ?? prev.source ?? "").trim(),
  };
  await c.env.DB.prepare(
    `UPDATE lead_inbox SET
      name=?1, phone=?2, email=?3, address=?4, notes=?5,
      quotation=?6, status=?7, source=?8,
      updated_at=datetime('now')
     WHERE id=?9`
  ).bind(
    next.name, next.phone, next.email, next.address, next.notes,
    next.quotation, next.status, next.source, id
  ).run();
  const diffs = inboxFieldDiffs(prev, next);
  if (diffs.length) {
    await logInbox(c.env.DB, {
      leadId: Number(id),
      leadName: next.name,
      action: "update",
      detail: diffs.join("；"),
    });
  }
  const row = await c.env.DB.prepare(
    "SELECT id, name, phone, email, address, notes, quotation, status, source, photos, created_at, updated_at FROM lead_inbox WHERE id=?1"
  ).bind(id).first();
  return c.json(await mapInbox(c.env.DB, row));
});

app.delete("/api/inbox/:id", async (c) => {
  const id = c.req.param("id");
  const prev = await c.env.DB.prepare(
    "SELECT id, name, phone, email, address, notes, quotation, status, source, created_at FROM lead_inbox WHERE id=?1"
  ).bind(id).first();
  if (!prev) return c.json({ error: "not found" }, 404);
  const { results: photoRows } = await c.env.DB.prepare(
    "SELECT name FROM lead_photos WHERE lead_id=?1 ORDER BY created_at ASC"
  ).bind(id).all();
  const photoNames = (photoRows || []).map((p, i) => p.name || `照片${i + 1}`);
  const snapshot = inboxSnapshot(prev, { photoNames });
  await c.env.DB.prepare("DELETE FROM lead_photos WHERE lead_id=?1").bind(id).run();
  await c.env.DB.prepare("DELETE FROM lead_inbox WHERE id=?1").bind(id).run();
  await logInbox(c.env.DB, {
    leadId: prev.id,
    leadName: prev.name,
    action: "delete",
    detail: `删除来客 → ${snapshot}`,
  });
  return c.json({ ok: true });
});

app.post("/api/inbox/:id/photos", async (c) => {
  const id = c.req.param("id");
  const prev = await c.env.DB.prepare(
    "SELECT id, name FROM lead_inbox WHERE id=?1"
  ).bind(id).first();
  if (!prev) return c.json({ error: "not found" }, 404);
  const b = await c.req.json();
  const dataUrl = String(b.dataUrl || "");
  const thumb = String(b.thumb || b.dataUrl || "");
  if (!dataUrl.startsWith("data:image/")) {
    return c.json({ error: "dataUrl must be an image data URL" }, 400);
  }
  if (dataUrl.length > 700_000) {
    return c.json({ error: "image too large — compress under ~500KB" }, 400);
  }
  if (thumb.length > 120_000) {
    return c.json({ error: "thumb too large" }, 400);
  }
  const count = (await c.env.DB.prepare(
    "SELECT COUNT(*) n FROM lead_photos WHERE lead_id=?1"
  ).bind(id).first())?.n || 0;
  if (count >= 6) return c.json({ error: "max 6 photos per lead" }, 400);
  const photoId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const photoName = String(b.name || "photo.jpg").slice(0, 80);
  await c.env.DB.prepare(
    `INSERT INTO lead_photos (id, lead_id, name, thumb, data)
     VALUES (?1,?2,?3,?4,?5)`
  ).bind(photoId, id, photoName, thumb || dataUrl, dataUrl).run();
  await c.env.DB.prepare(
    "UPDATE lead_inbox SET updated_at=datetime('now') WHERE id=?1"
  ).bind(id).run();
  await logInbox(c.env.DB, {
    leadId: prev.id,
    leadName: prev.name,
    action: "photo_add",
    detail: `上传照片 → 文件名：${photoName}；来客：${prev.name}；当前共 ${count + 1} 张`,
  });
  const photos = await listPhotosForLead(c.env.DB, id);
  return c.json({ ok: true, photo: photoMeta(id, { id: photoId, name: photoName, thumb: thumb || dataUrl }), photos });
});

app.get("/api/inbox/:id/photos/:photoId", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, name, data FROM lead_photos WHERE id=?1 AND lead_id=?2"
  ).bind(c.req.param("photoId"), c.req.param("id")).first();
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json({ id: row.id, name: row.name, dataUrl: row.data });
});

app.delete("/api/inbox/:id/photos/:photoId", async (c) => {
  const id = c.req.param("id");
  const photoId = c.req.param("photoId");
  const lead = await c.env.DB.prepare(
    "SELECT id, name FROM lead_inbox WHERE id=?1"
  ).bind(id).first();
  const photo = await c.env.DB.prepare(
    "SELECT id, name FROM lead_photos WHERE id=?1 AND lead_id=?2"
  ).bind(photoId, id).first();
  if (!photo) return c.json({ error: "not found" }, 404);
  await c.env.DB.prepare(
    "DELETE FROM lead_photos WHERE id=?1 AND lead_id=?2"
  ).bind(photoId, id).run();
  await logInbox(c.env.DB, {
    leadId: lead?.id || Number(id),
    leadName: lead?.name || "",
    action: "photo_delete",
    detail: `删除照片 → 文件名：${photo.name || photoId}；来客：${lead?.name || "—"}；照片ID：${photoId}`,
  });
  const photos = await listPhotosForLead(c.env.DB, id);
  return c.json({ ok: true, photos });
});

app.get("/api/reports/summary", async (c) => {
  const total = (await c.env.DB.prepare("SELECT COUNT(*) n FROM customers").first()).n;
  const depNone = (await c.env.DB.prepare(`
    SELECT COUNT(*) n FROM customers c WHERE c.stage!='lost'
    AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.customer_id=c.id AND p.type='deposit' AND p.status='paid')
    AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.customer_id=c.id AND p.type='full' AND p.status='paid')
  `).first()).n;
  const depPaid = (await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT customer_id) n FROM payments WHERE type='deposit' AND status='paid'
  `).first()).n;
  const full = (await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT customer_id) n FROM payments WHERE type='full' AND status='paid'
  `).first()).n;
  const bySource = (await c.env.DB.prepare(`
    SELECT COALESCE(NULLIF(source,''),'unknown') AS source, COUNT(*) n
    FROM customers GROUP BY COALESCE(NULLIF(source,''),'unknown') ORDER BY n DESC
  `).all()).results;
  const byStyle = (await c.env.DB.prepare(`
    SELECT COALESCE(NULLIF(fence_style,''),'unset') AS style, COUNT(*) n
    FROM customers GROUP BY COALESCE(NULLIF(fence_style,''),'unset') ORDER BY n DESC
  `).all()).results;
  return c.json({ total, depNone, depPaid, full, bySource, byStyle });
});

// SPA / static assets fallback (non-API)
app.all("*", async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text("Not found", 404);
});

export default app;
