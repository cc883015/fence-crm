-- Slim inbox statuses: keep new / quoted / deposit_paid, add done.
-- Retired values map into quoted so existing rows stay visible.
UPDATE lead_inbox
SET status = 'quoted', updated_at = datetime('now')
WHERE status IN ('style', 'visit', 'deposit_wait');
