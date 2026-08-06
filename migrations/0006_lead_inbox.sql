-- Multi-channel lead inbox (Facebook / phone / walk-in, etc.)
CREATE TABLE IF NOT EXISTS lead_inbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  quotation TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT DEFAULT '',
  photos TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lead_inbox_status ON lead_inbox(status);
CREATE INDEX IF NOT EXISTS idx_lead_inbox_created ON lead_inbox(created_at);
