import React from "react";

/** Unit prices from NOVA Fence quotes / Xero (AUD, before GST unless noted). */
const SECTIONS = [
  {
    id: "fences-gates",
    title_zh: "栅栏 & 门",
    title_en: "Fences & Gates",
    rows: [
      {
        code: "HF2B00",
        desc_zh: "横板围栏 · 2400×1185 · Black Gloss · Full Pack",
        desc_en: "Horizontal slat fence - 2400*1185 - Black Gloss - Full Pack",
        price: 339.9,
      },
      {
        code: "HD8B00",
        desc_zh: "横板侧门 · 1000×1800 · Black Gloss · Full Pack",
        desc_en: "Horizontal slat side gate - 1000*1800 - Black Gloss - Full Pack",
        price: 482.9,
      },
      {
        code: "—",
        desc_zh: "横板推拉门 · 6000mm",
        desc_en: "Horizontal Slat Sliding Gate 6000mm Gate",
        price: 4400,
      },
      {
        code: "—",
        desc_zh: "横板推拉门 · 4500×1800 · Black（双开定制）",
        desc_en: "Horizontal slat Sliding gate - 4500*1800 - Black (double gate, custom)",
        price: 3630,
      },
    ],
  },
  {
    id: "posts",
    title_zh: "立柱 Posts",
    title_en: "Posts",
    rows: [
      {
        code: "FP4B00",
        desc_zh: "埋地柱 · 65×65×2400 · Black Gloss · Full Pack",
        desc_en: "Inground post - 65*65*2400 - Black Gloss - Full Pack",
        price: 59,
      },
      {
        code: "OP5B00",
        desc_zh: "侧门柱 · 50×50×1900 · Black Gloss · Full Pack",
        desc_en: "Side gate post - 50*50*1900 - Black Gloss - Full Pack",
        price: 60.5,
      },
      {
        code: "B00",
        desc_zh: "推拉门柱 · 100×100×1950 · Black Gloss · Full Pack",
        desc_en: "Sliding gate post - 100*100*1950 - Black Gloss - Full Pack",
        price: 308,
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
        desc_zh: "围栏支架 40×40 · 四只装 + 12 螺丝",
        desc_en: "Fence Brackets (40 x 40mm) - Pack of Four, including 12 screws",
        price: 22,
      },
      {
        code: "1138",
        desc_zh: "铰链 Hinges",
        desc_en: "hinges",
        price: 42.46,
      },
      {
        code: "1139",
        desc_zh: "锁 Lock",
        desc_en: "lock",
        price: 117.13,
      },
      {
        code: "S1",
        desc_zh: "推拉门配件套装",
        desc_en: "Sliding Gate Accessories — Track rail ($60) + Base Wheel ($88) + Stopper ($20) + Guide ($20) + Buffer Lock ($10)",
        price: 217.8,
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
            来自 NOVA 报价单 / Xero 单价（AUD，未含 GST；GST +10%）。电话粗估用，以实测正式报价为准。
          </p>
        </div>
      </div>

      {SECTIONS.map((sec) => (
        <section key={sec.id} className={`price-section ts-glass ${sec.id === "fences-gates" ? "price-section-priority" : ""}`}>
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
        Notes: Sliding gate accessories kit breakdown — Track rail $60 · Base Wheel $88 · Stopper $20 · Guide $20 · Buffer Lock $10 (= $217.80).
        Custom double-gate posts may match B00 unit price. Xero may show slightly different list prices on some SKUs — confirm before locking a quote.
      </p>
    </div>
  );
}
