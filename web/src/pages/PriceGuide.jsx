import React from "react";
import { CATALOGUE, CONTACT } from "../data/products.js";

/** Rough guide prices for phone quotes — AUD, ex GST unless noted */
const PRICE_ROWS = [
  {
    slug: "blade",
    unit: "per metre (supply + install guide)",
    black: "$180–$220 / m",
    grey: "$180–$220 / m",
    note: "1.5mm · 40mm gap · common privacy pick",
  },
  {
    slug: "decorative",
    unit: "per metre (supply + install guide)",
    black: "$190–$230 / m",
    grey: "$190–$230 / m",
    note: "1.2mm · 35mm gap · tighter look",
  },
  {
    slug: "horizontal",
    unit: "per metre (supply + install guide)",
    black: "$200–$240 / m",
    grey: "$200–$240 / m",
    note: "1.2mm · 15mm gap · max privacy",
  },
  {
    slug: "vertical-batten",
    unit: "per metre (supply + install guide)",
    black: "$170–$210 / m",
    grey: "$170–$210 / m",
    note: "1.2mm · 40mm gap · clean lines",
  },
  {
    slug: "pedestrian-gate",
    unit: "each (ready stock guide)",
    black: "$450–$650",
    grey: "$450–$650",
    note: "Matching style · colour to fence",
  },
  {
    slug: "brick-pillar",
    unit: "per job (guide only)",
    black: "POA",
    grey: "POA",
    note: "Brick + fence to ground · site dependent",
  },
];

const EXTRAS = [
  { zh: "电动门（车道 4–6m）", en: "Auto gate 4–6m driveway", price: "POA · usually $3.5k–$7k+" },
  { zh: "$200 定金", en: "Deposit", price: "$200 · price match after measure" },
  { zh: "斜坡 / 异形", en: "Slope / custom", price: "+10–25% guide" },
  { zh: "服务区域", en: "Service area", price: CONTACT.areas.join(" · ") },
];

export default function PriceGuide() {
  const bySlug = Object.fromEntries(CATALOGUE.map((p) => [p.slug, p]));

  return (
    <div className="orders-main">
      <div className="orders-head">
        <div>
          <p className="ts-eyebrow">Quick quote · 报价参考</p>
          <h2 style={{ margin: "0.2rem 0 0" }}>常见产品报价参考</h2>
          <p className="muted">
            电话粗估用。最终以测量后正式报价为准 · AUD guide only, confirm on site.
          </p>
        </div>
      </div>

      <div className="price-table ts-glass">
        <div className="price-row price-head">
          <span>产品</span>
          <span>Black</span>
          <span>Grey</span>
          <span>备注</span>
        </div>
        {PRICE_ROWS.map((row) => {
          const p = bySlug[row.slug] || {};
          return (
            <div key={row.slug} className="price-row">
              <span>
                <strong>{p.name_zh || row.slug}</strong>
                <br />
                <span className="muted">{p.name_en}</span>
                <br />
                <span className="muted" style={{ fontSize: "0.78rem" }}>{row.unit}</span>
              </span>
              <span className="price-num">{row.black}</span>
              <span className="price-num">{row.grey}</span>
              <span className="muted">{row.note}</span>
            </div>
          );
        })}
      </div>

      <div className="price-extras ts-glass">
        <h3 style={{ margin: "0 0 0.65rem" }}>其他常见项</h3>
        {EXTRAS.map((x) => (
          <div key={x.en} className="price-extra-row">
            <span>
              <strong>{x.zh}</strong>
              <span className="muted"> · {x.en}</span>
            </span>
            <span className="price-num">{x.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
