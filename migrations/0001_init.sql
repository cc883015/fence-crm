-- ═══════════════════════════════════════════════════════════
-- Fence CRM 数据库初始化 · Cloudflare D1 (SQLite)
-- 第一期 MVP: customers / leads / products / payments
-- 预留: quotes / projects / users / activities
-- ═══════════════════════════════════════════════════════════

-- ── 销售/管理员 ───────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT,
  email         TEXT UNIQUE,
  password_hash TEXT,
  role          TEXT DEFAULT 'sales',   -- admin/sales
  created_at    TEXT DEFAULT (datetime('now'))
);

-- ── 真实客户主档(去重后)─────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT,
  phone             TEXT,
  email             TEXT,
  suburb            TEXT,
  postcode          TEXT,
  address           TEXT,
  preferred_contact TEXT,               -- phone/email/wechat
  assigned_user_id  INTEGER,
  stage             TEXT DEFAULT 'new',  -- new/quoted/style/visit/deposit_wait/deposit_paid/measured/paid_full/lost
  notes             TEXT,
  created_at        TEXT DEFAULT (datetime('now')),
  updated_at        TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_stage ON customers(stage);

-- ── 线索(官网每次提交一条,去重来源)─────────
CREATE TABLE IF NOT EXISTS leads (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id    INTEGER,               -- 去重后关联的客户(可空=待处理)
  source         TEXT DEFAULT 'website',-- website/facebook/google_ads/referral/walk_in/phone
  intake_status  TEXT DEFAULT 'new',    -- new/duplicate/merged/assigned
  raw_name       TEXT,
  raw_phone      TEXT,
  raw_email      TEXT,
  suburb         TEXT,
  fence_length   TEXT,
  fence_height   TEXT,
  fence_type     TEXT,                  -- blade/decorative/horizontal
  gate_required  INTEGER DEFAULT 0,
  automatic_gate INTEGER DEFAULT 0,
  brick_wall     INTEGER DEFAULT 0,
  slope          TEXT DEFAULT 'unknown',
  budget         TEXT,
  timeline       TEXT,
  photos         TEXT,                  -- JSON 数组, R2 URL
  message        TEXT,
  created_at     TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_intake ON leads(intake_status);

-- ── 产品(官网展示 + 后台维护)────────────────
CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT UNIQUE,              -- blade/horizontal/decorative
  name_zh     TEXT,
  name_en     TEXT,
  thickness   TEXT,
  gap         TEXT,
  panel       TEXT,
  price_min   REAL,
  price_max   REAL,
  features    TEXT,                     -- JSON: ["Privacy","Modern"]
  script_en   TEXT,                     -- 英文话术
  cover_url   TEXT,
  active      INTEGER DEFAULT 1
);

-- ── 报价单 ───────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id   INTEGER NOT NULL,
  fence_style   TEXT,
  length_m      REAL,
  height_m      REAL,
  gate_included INTEGER DEFAULT 0,
  brick_wall    INTEGER DEFAULT 0,
  material_cost REAL,
  labour_cost   REAL,
  gst           REAL,
  total         REAL,
  pdf_url       TEXT,
  status        TEXT DEFAULT 'draft',   -- draft/sent/accepted/rejected
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);

-- ── 付款(定金/全款/退款)─────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id   INTEGER NOT NULL,
  quote_id      INTEGER,
  type          TEXT,                   -- deposit/full/refund
  amount        REAL,
  method        TEXT,                   -- payid/card/bank/cash
  status        TEXT DEFAULT 'pending', -- pending/paid/refunded
  paid_at       TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);

-- ── 项目案例(官网 Gallery)───────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT,
  cover_url   TEXT,
  images      TEXT,
  location    TEXT,
  style       TEXT,
  description TEXT,
  published   INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- ── 跟进时间线 ───────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  user_id     INTEGER,
  type        TEXT,                     -- message/quote_sent/photo_received/visit_booked/deposit_paid/note
  content     TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_activities_customer ON activities(customer_id);
