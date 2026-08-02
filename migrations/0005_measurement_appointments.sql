-- Wed / Sat site measurement appointments (admin)
CREATE TABLE IF NOT EXISTS measurement_appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  appointment_date TEXT NOT NULL,
  weekday TEXT NOT NULL,
  appointment_time TEXT DEFAULT '',
  address TEXT NOT NULL,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'scheduled',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_meas_appt_date ON measurement_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_meas_appt_weekday ON measurement_appointments(weekday);
CREATE INDEX IF NOT EXISTS idx_meas_appt_status ON measurement_appointments(status);
