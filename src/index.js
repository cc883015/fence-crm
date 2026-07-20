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
    await c.env.DB.prepare(
      `UPDATE customers SET
        name=COALESCE(?1,name), suburb=COALESCE(?2,suburb),
        source=CASE WHEN source='' OR source IS NULL THEN 'website' ELSE source END,
        fence_length=COALESCE(NULLIF(?3,''), fence_length),
        fence_style=COALESCE(NULLIF(?4,''), fence_style),
        gate_required=CASE WHEN ?5=1 THEN 1 ELSE gate_required END,
        color=COALESCE(NULLIF(?6,''), color),
        updated_at=datetime('now') WHERE id=?7`
    ).bind(
      b.name || null, b.suburb || null, b.fence_length || "", b.fence_type || "",
      (b.gate_required || b.automatic_gate) ? 1 : 0, b.color || "", customerId
    ).run();
  } else {
    const res = await c.env.DB.prepare(
      `INSERT INTO customers
        (name, phone, email, suburb, stage, source, fence_length, fence_style, gate_required, color, install_type, slope, intake_answers)
       VALUES (?1,?2,?3,?4,'new','website',?5,?6,?7,?8,?9,?10,?11)`
    ).bind(
      b.name || "", phone, email, b.suburb || "",
      b.fence_length || "", b.fence_type || "",
      (b.gate_required || b.automatic_gate) ? 1 : 0,
      b.color || "",
      b.brick_wall ? "brick" : (b.install_type || ""),
      b.slope || "unknown",
      JSON.stringify({ channel: "website", message: b.message || "" })
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
    b.suburb || "", b.fence_length || "", b.fence_height || "", b.fence_type || "",
    b.gate_required ? 1 : 0, b.automatic_gate ? 1 : 0, b.brick_wall ? 1 : 0,
    b.slope || "unknown", b.budget || "", b.timeline || "",
    JSON.stringify(b.photos || []), b.message || ""
  ).run();

  await c.env.DB.prepare(
    "INSERT INTO activities (customer_id, type, content) VALUES (?1,'message',?2)"
  ).bind(customerId, `官网提交(${b.source || "website"})`).run();

  return c.json({ ok: true, customer_id: customerId, intake_status: intake });
});

// ─── Protected admin APIs ───────────────────
app.use("/api/customers/*", requireAuth);
app.use("/api/customers", requireAuth);
app.use("/api/payments", requireAuth);
app.use("/api/payments/*", requireAuth);
app.use("/api/reports/*", requireAuth);
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
    JSON.stringify(b.intake_answers || {}), id
  ).run();
  return c.json({ ok: true });
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
