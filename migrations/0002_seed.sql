-- ═══════════════════════════════════════════════════════════
-- 种子数据 · 让系统一跑起来就有东西看
-- ═══════════════════════════════════════════════════════════

-- 管理员
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin', 'admin@fence.local', 'dev-no-hash', 'admin'),
  ('Charles', 'sales@fence.local', 'dev-no-hash', 'sales');

-- 三款围栏产品(带英文话术)
INSERT INTO products (slug, name_zh, name_en, thickness, gap, panel, price_min, price_max, features, script_en, active) VALUES
('blade', '刀片围栏', 'Blade Fence', '1.5mm', '40mm', '2.4m', 180, 260,
 '["Privacy","Modern","Wind Resistant","Powder Coated"]',
 'Hi,

I''ve sent the quote to your email.

The blade fence included in the quote is made from 1.5mm thick aluminium with 40mm gaps between the blades. Each panel is 2.4m long.

This design provides an excellent balance of privacy, appearance, strength and durability.

With aluminium fencing, the main factors affecting the price are the material thickness, gap spacing and panel length.

I''ve attached some photos for your reference.

Thank you.', 1),
('decorative', '造型/竖版围栏', 'Decorative Aluminium Fence', '1.2mm', '35mm', '2.36m', 150, 230,
 '["Privacy","Appearance","Strength","Durability"]',
 'Hi,

I''ve sent the quote to your email.

The decorative aluminium fence included in the quote is made from 1.2mm thick aluminium with 35mm gaps between the battens. Each panel is 2.36m long.

This design provides an excellent balance of privacy, appearance, strength and durability.

With aluminium fencing, the main factors affecting the price are the material thickness, gap spacing and panel length.

I''ve attached some photos for your reference.

Thank you.', 1),
('horizontal', '横板围栏', 'Horizontal Slat Fence', '1.2mm', '15mm', '2.4m', 160, 240,
 '["Privacy","Strength","Durability","Modern Appearance"]',
 'Hi,

I''ve sent the quote to your email.

The horizontal slat fence included in the quote is made from 1.2mm thick aluminium throughout the entire panel, not just the top and bottom rails. The slats are 65mm wide with 15mm gaps, and each panel is 2.4m long.

This design offers excellent privacy, strength, durability and a modern appearance.

With aluminium fencing, the main factors affecting the price are the material thickness, slat size, gap spacing and panel length.

I''ve attached some photos for your reference.

Thank you.', 1);

-- 示例客户
INSERT INTO customers (name, phone, email, suburb, stage, assigned_user_id, notes) VALUES
  ('王先生', '0412000001', 'wang@example.com', 'Sunnybank', 'deposit_wait', 2, '要电动门约5m,直接落地'),
  ('Sarah', '0412000002', 'sarah@example.com', 'Logan Central', 'deposit_paid', 2, '砖墙+刀片围栏'),
  ('李女士', '0412000003', 'li@example.com', 'Southport', 'new', 2, '刚咨询,尺寸未知'),
  ('Tom', '0412000004', 'tom@example.com', 'Ipswich', 'paid_full', 2, '造型围栏,已完工');

-- 示例线索(含来源,用于统计)
INSERT INTO leads (customer_id, source, intake_status, raw_name, raw_phone, suburb, fence_length, fence_type, gate_required, message) VALUES
  (1, 'google_ads', 'assigned', '王先生', '0412000001', 'Sunnybank', '30m', 'horizontal', 1, '想装横板围栏'),
  (2, 'facebook', 'assigned', 'Sarah', '0412000002', 'Logan Central', '22m', 'blade', 0, 'brick wall + blade'),
  (3, 'website', 'new', '李女士', '0412000003', 'Southport', '', '', 0, 'just asking'),
  (NULL, 'referral', 'new', 'Mike', '0412000099', 'Springfield', '18m', 'decorative', 1, 'referred by Tom');

-- 示例报价
INSERT INTO quotes (customer_id, fence_style, length_m, gate_included, brick_wall, material_cost, labour_cost, gst, total, status) VALUES
  (1, 'horizontal', 30, 1, 0, 3200, 800, 400, 4400, 'sent'),
  (2, 'blade', 22, 0, 1, 5000, 1200, 620, 6820, 'accepted'),
  (4, 'decorative', 40, 0, 0, 3600, 1000, 460, 5060, 'accepted');

-- 示例付款
INSERT INTO payments (customer_id, quote_id, type, amount, method, status, paid_at) VALUES
  (2, 2, 'deposit', 200, 'payid', 'paid', datetime('now','-3 days')),
  (4, 3, 'deposit', 200, 'bank', 'paid', datetime('now','-20 days')),
  (4, 3, 'full', 4860, 'bank', 'paid', datetime('now','-2 days'));

-- 示例项目案例
INSERT INTO projects (title, location, style, description, published) VALUES
  ('Modern Horizontal Fence - Sunnybank', 'Sunnybank QLD', 'horizontal', '30m horizontal slat fence with automatic gate.', 1),
  ('Blade Privacy Fence - Logan', 'Logan QLD', 'blade', 'Blade fence on brick wall, front yard.', 1);
