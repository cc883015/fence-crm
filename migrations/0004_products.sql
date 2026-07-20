-- Refresh NOVA product catalogue (safe to re-run)
UPDATE products SET active=0;

DELETE FROM products WHERE slug IN (
  'blade','decorative','horizontal','vertical-batten','pedestrian-gate','brick-pillar'
);

INSERT INTO products (slug, name_zh, name_en, thickness, gap, panel, price_min, price_max, features, script_en, cover_url, active) VALUES
('blade', '刀片围栏', 'Blade Fence', '1.5mm', '40mm', '2.4m', 180, 260,
 '["Privacy","Modern","Wind Resistant","Powder Coated"]',
 'Hi,

I''ve sent the quote to your email.

The blade fence included in the quote is made from 1.5mm thick aluminium with 40mm gaps between the blades. Each panel is 2.4m long.

This design provides an excellent balance of privacy, appearance, strength and durability.

Thank you.', '/products/blade.jpg', 1),
('decorative', '造型/竖版围栏', 'Decorative Aluminium Fence', '1.2mm', '35mm', '2.36m', 150, 230,
 '["Privacy","Appearance","Strength","Durability","35mm Gap"]',
 'Hi,

I''ve sent the quote to your email.

The decorative aluminium fence included in the quote is made from 1.2mm thick aluminium with 35mm gaps between the battens. Each panel is 2.36m long.

Thank you.', '/products/decorative.jpg', 1),
('horizontal', '横板围栏', 'Horizontal Slat Fence', '1.2mm', '15mm', '2.4m', 160, 240,
 '["Privacy","Strength","Durability","Modern Appearance","65mm Slats"]',
 'Hi,

I''ve sent the quote to your email.

The horizontal slat fence included in the quote is made from 1.2mm thick aluminium throughout the entire panel. The slats are 65mm wide with 15mm gaps, and each panel is 2.4m long.

Thank you.', '/products/horizontal.jpg', 1),
('vertical-batten', '纵向条栅围栏', 'Vertical Batten Fence', '1.2mm', '40mm', '2.4m', 150, 230,
 '["Modern Style","Privacy","Premium Quality","Ready Stock"]',
 'Hi,

I''ve sent the quote to your email.

The vertical batten fence uses uniform parallel vertical slats with a recommended 40mm gap for optimal privacy.

Thank you.', '/products/vertical.jpg', 1),
('pedestrian-gate', '行人门', 'Pedestrian Gates', 'aluminium', '—', 'ready stock', 0, 0,
 '["2 Colours","3 Styles","Ready Stock","Premium Finish"]',
 'Hi,

Our pedestrian gates are available in 2 colours and 3 styles, ready stock for quick delivery.

Thank you.', '/products/gate.jpg', 1),
('brick-pillar', '砖柱 + 落地围栏', 'Brick Pillar + Fencing to Ground', '—', '—', 'custom', 0, 0,
 '["Stylish & Modern","Cost Effective","Fencing to Ground"]',
 'Hi,

Brick pillar with fencing installed to the ground — stylish, modern and cost effective.

Thank you.', '/products/brick.jpg', 1);

UPDATE users SET email='NOVAFENCE', password_hash='novafence123', name='NOVA Admin', role='admin' WHERE id=1;
