-- NOVA FENCE intake fields + product refresh
-- Columns: ignore errors if re-run; D1 may fail on duplicate ADD COLUMN

ALTER TABLE customers ADD COLUMN source TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN fence_length TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN gate_required INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN gate_width TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN install_type TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN fence_style TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN color TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN slope TEXT DEFAULT 'unknown';
ALTER TABLE customers ADD COLUMN dual_estimate INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN photo_note TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN deposit_informed INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN service_area TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN intake_answers TEXT DEFAULT '{}';
