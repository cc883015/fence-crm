-- Operation history for lead inbox (create / edit / delete / photos)
CREATE TABLE IF NOT EXISTS lead_inbox_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER,
  lead_name TEXT DEFAULT '',
  action TEXT NOT NULL,
  detail TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lead_inbox_logs_created ON lead_inbox_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_inbox_logs_lead ON lead_inbox_logs(lead_id);
