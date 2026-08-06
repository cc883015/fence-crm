-- Split lead photos out of inbox JSON so lists stay light
CREATE TABLE IF NOT EXISTS lead_photos (
  id TEXT PRIMARY KEY,
  lead_id INTEGER NOT NULL,
  name TEXT DEFAULT '',
  thumb TEXT NOT NULL DEFAULT '',
  data TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES lead_inbox(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lead_photos_lead ON lead_photos(lead_id);
