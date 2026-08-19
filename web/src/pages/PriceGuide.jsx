import React from "react";

/** Unit sale prices from Xero (AUD). Confirm GST / site extras before locking a quote. */
const SECTIONS = [
  {
    id: "fences",
    title_zh: "栅栏 Fences",
    title_en: "Fence panels",
    rows: [
      {
        code: "HF2B00",
        desc_zh: "横板围栏 · 2400×1185 · Black / Grey Gloss",
        desc_en: "Horizontal slat fence - 2400*1185",
        price: 309,
      },
      {
        code: "HF8B00",
        desc_zh: "横板围栏 · 2400×1800 · Black / Grey Gloss",
        desc_en: "Horizontal slat fence - 2400*1800",
        price: 389,
      },
      {
        code: "HF8B02",
        desc_zh: "横板围栏 · 2400×1500 · Black Gloss",
        desc_en: "Horizontal slat fence - 2400*1500",
        price: 389,
      },
      {
        code: "VF2B00",
        desc_zh: "刀片围栏 · 2400×1200 · Black Gloss / Grey Matte",
        desc_en: "Vertical blade fence - 2400*1200",
        price: 479,
      },
      {
        code: "VF8B00",
        desc_zh: "刀片围栏 · 2400×1800 · Black Gloss / Grey Matte",
        desc_en: "Vertical blade fence - 2400*1800",
        price: 659,
      },
      {
        code: "ZF2B00",
        desc_zh: "竖条围栏 · 2365×1200 · Black / Grey · Gloss / Matte",
        desc_en: "Vertical batten fence - 2365*1200",
        price: 480,
      },
      {
        code: "ZF8B00",
        desc_zh: "竖条围栏 · 2365×1800 · Black / Grey · Gloss / Matte",
        desc_en: "Vertical batten fence - 2365*1800",
        price: 550,
      },
    ],
  },
  {
    id: "gates",
    title_zh: "门 Gates",
    title_en: "Side, pedestrian & sliding gates",
    rows: [
      {
        code: "HD8B00",
        desc_zh: "横板侧门 · 1000×1800 · Black / Grey Gloss",
        desc_en: "Horizontal slat side gate - 1000*1800",
        price: 439,
      },
      {
        code: "VD9B00",
        desc_zh: "刀片侧门 · 1000×1800 · Black Gloss / Grey Matte",
        desc_en: "Vertical blade side gate - 1000*1800",
        price: 490,
      },
      {
        code: "VBG150",
        desc_zh: "刀片行人门 · 1000×1500",
        desc_en: "Vertical Blade Pedestrian Gate 1000*1500",
        price: 420,
      },
      {
        code: "ZD8B00",
        desc_zh: "竖条侧门 · 1000×1800 · Black / Grey · Gloss / Matte",
        desc_en: "Vertical batten side gate - 1000*1800",
        price: 450,
      },
      {
        code: "HS4B",
        desc_zh: "横板推拉门 · 4500×1757 · Black / Grey",
        desc_en: "Horizontal slat Sliding gate - 4500*1757",
        price: 3300,
      },
      {
        code: "HS8B",
        desc_zh: "横板推拉门 · 4500×1800 · Black",
        desc_en: "Horizontal slat Sliding gate - 4500*1800 - Black",
        price: 3300,
      },
      {
        code: "Gate",
        desc_zh: "横板推拉门 · 6000mm",
        desc_en: "Horizontal Slat Sliding Gate 6000mm Gate",
        price: 4000,
      },
      {
        code: "VS4G",
        desc_zh: "刀片推拉门 · 4500×1800 · Black / Grey",
        desc_en: "Vertical blade Sliding gate - 4500*1800",
        price: 4800,
      },
      {
        code: "VS6B",
        desc_zh: "刀片推拉门 · 6000×1800 · Black / Grey",
        desc_en: "Vertical blade Sliding gate - 6000*1800",
        price: 5800,
      },
      {
        code: "VLSG",
        desc_zh: "刀片推拉门 · 6000×2000 · Black",
        desc_en: "Vertical blade Sliding gate - 6000*2000 - Black",
        price: 6000,
      },
      {
        code: "ZS4B",
        desc_zh: "竖条推拉门 · 4500×1800 · Black / Grey",
        desc_en: "Vertical batten Sliding gate - 4500*1800",
        price: 4200,
      },
      {
        code: "ZS6B",
        desc_zh: "竖条推拉门 · 6000×1800 · Black / Grey",
        desc_en: "Vertical batten Sliding gate - 6000*1800",
        price: 5000,
      },
    ],
  },
  {
    id: "posts",
    title_zh: "立柱 Posts",
    title_en: "Posts",
    rows: [
      {
        code: "DP5B00",
        desc_zh: "侧门柱 · 50×50×1900 · 各色 Gloss / Matte",
        desc_en: "Side gate post - 50*50*1900",
        price: 55,
      },
      {
        code: "DP6B00",
        desc_zh: "侧门柱 · 65×65×1900 · 各色 Gloss / Matte",
        desc_en: "Side gate post - 65*65*1900",
        price: 55,
      },
      {
        code: "SP1B00",
        desc_zh: "推拉门柱 · 100×100×1950 · 各色 Gloss / Matte",
        desc_en: "Sliding gate post - 100*100*1950",
        price: 280,
      },
      {
        code: "ZCAB00",
        desc_zh: "推拉门柱套装 · 6000 · 各色 Full Pack",
        desc_en: "Sliding gate post - 6000 - Full Pack",
        price: 45,
      },
    ],
  },
  {
    id: "hardware",
    title_zh: "配件 Hardware",
    title_en: "Parts & accessories",
    rows: [
      {
        code: "fenceparts",
        desc_zh: "围栏支架 40×40 · Black · 四只装",
        desc_en: "Fence Brackets (40 x 40mm) - Black - Pack of Four",
        price: 20,
      },
      {
        code: "PARTS1",
        desc_zh: "推拉门配件套装",
        desc_en: "Sliding Gate Accessories",
        price: 198,
      },
      {
        code: "parts2",
        desc_zh: "推拉门零件套装",
        desc_en: "Sliding Gate Parts",
        price: 258,
      },
    ],
  },
  {
    id: "services",
    title_zh: "安装服务",
    title_en: "Services",
    rows: [
      {
        code: "INSTALL",
        desc_zh: "安装费（按项目）",
        desc_en: "Installation Service",
        price: 1500,
        note: "Site dependent · confirm per job",
      },
    ],
  },
];

function money(n) {
  return n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  });
}

export default function PriceGuide() {
  return (
    <div className="orders-main">
      <div className="orders-head">
        <div>
          <p className="ts-eyebrow">Quick quote · 报价参考</p>
          <h2 style={{ margin: "0.2rem 0 0" }}>常见产品报价参考</h2>
          <p className="muted">
            来自 Xero 销售价（AUD）。同尺寸不同颜色 / 光面哑光多数同价，表中只列常用规格。电话粗估用，以实测正式报价为准；GST 另计 +10%。
          </p>
        </div>
      </div>

      {SECTIONS.map((sec) => (
        <section
          key={sec.id}
          className={`price-section ts-glass ${
            sec.id === "fences" || sec.id === "gates" ? "price-section-priority" : ""
          }`}
        >
          <div className="price-section-head">
            <h3>
              {sec.title_zh}
              <span className="muted"> · {sec.title_en}</span>
            </h3>
          </div>
          <div className="price-table">
            <div className="price-row price-head">
              <span>Item</span>
              <span>Description</span>
              <span>Unit Price</span>
              <span>GST</span>
            </div>
            {sec.rows.map((row) => (
              <div key={`${row.code}-${row.desc_en}`} className="price-row">
                <span className="price-code">{row.code}</span>
                <span>
                  <strong>{row.desc_zh}</strong>
                  <br />
                  <span className="muted">{row.desc_en}</span>
                  {row.note && (
                    <>
                      <br />
                      <span className="muted" style={{ fontSize: "0.78rem" }}>{row.note}</span>
                    </>
                  )}
                </span>
                <span className="price-num">{money(row.price)}</span>
                <span className="muted">10%</span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <p className="muted" style={{ marginTop: "0.85rem", fontSize: "0.85rem" }}>
        Notes: Same size / colour variants usually share one sale price in Xero.
        Sliding-gate accessory kits are PARTS1 ($198) and parts2 ($258) — pick the kit that matches the job.
        Skip $0 sale items (e.g. GTA000, some custom SKUs) until Xero is corrected.
      </p>
    </div>
  );
}
