-- Saved customer quote summary sheets (bind to inbox lead and/or measure appointment)
CREATE TABLE IF NOT EXISTS quote_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER,
  appointment_id INTEGER,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  payload TEXT NOT NULL DEFAULT '{}',
  summary_text TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES lead_inbox(id) ON DELETE SET NULL,
  FOREIGN KEY (appointment_id) REFERENCES measurement_appointments(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_quote_summaries_lead ON quote_summaries(lead_id);
CREATE INDEX IF NOT EXISTS idx_quote_summaries_appt ON quote_summaries(appointment_id);
CREATE INDEX IF NOT EXISTS idx_quote_summaries_updated ON quote_summaries(updated_at DESC);
