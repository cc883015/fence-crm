-- Quick Quote: sales calculator history (customer name only)
CREATE TABLE IF NOT EXISTS quick_quotes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id       TEXT UNIQUE NOT NULL,
  customer_name  TEXT NOT NULL,
  fence_type     TEXT,
  payload        TEXT NOT NULL,
  subtotal       REAL DEFAULT 0,
  gst            REAL DEFAULT 0,
  discount       REAL DEFAULT 0,
  adjustment     REAL DEFAULT 0,
  total          REAL DEFAULT 0,
  status         TEXT DEFAULT 'saved',
  created_at     TEXT DEFAULT (datetime('now')),
  updated_at     TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_quick_quotes_date ON quick_quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quick_quotes_name ON quick_quotes(customer_name);
