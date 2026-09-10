import React from "react";
import { money } from "../../lib/quoteMath.js";
import { pricingConfig } from "../../data/pricingConfig.js";

const ROWS = [
  ["fence", "Fence", "围栏"],
  ["pedestrianGate", "Pedestrian Gate", "行人门"],
  ["slidingGate", "Sliding Gate", "滑动门"],
  ["motor", "Motor", "电机"],
  ["brickWall", "Brick Wall", "砖墙"],
  ["brickPillars", "Brick Pillars", "砖柱"],
  ["colorbond", "Colorbond", "彩钢"],
  ["posts", "Posts", "柱子"],
  ["installation", "Installation", "安装"],
  ["accessories", "Accessories", "配件"],
  ["retaining", "Retaining", "挡土"],
  ["removal", "Removal", "拆除"],
  ["other", "Other", "其他"],
];

export default function QuoteSummary({ summary, discount, adjustment, onChange, locked }) {
  const gstPct = Math.round((pricingConfig.gstRate || 0) * 100);
  return (
    <aside className="qq-sum ts-glass">
      <p className="ts-eyebrow">Quote Summary</p>
      <h3>实时汇总</h3>
      <ul className="qq-sum-list">
        {ROWS.map(([key, en, zh]) => (
          <li key={key} className={summary.modules[key] ? "" : "is-zero"}>
            <span>{en} <em>{zh}</em></span>
            <b>{money(summary.modules[key])}</b>
          </li>
        ))}
      </ul>
      <div className="qq-sum-tot">
        <div><span>Subtotal</span><b>{money(summary.subtotal)}</b></div>
        <div><span>GST ({gstPct}%)</span><b>{money(summary.gst)}</b></div>
        <label className="qq-sum-edit">
          <span>Discount</span>
          <input
            type="number"
            step="1"
            disabled={locked}
            value={discount}
            onChange={(e) => onChange("discount", e.target.value)}
          />
        </label>
        <label className="qq-sum-edit">
          <span>Adjustment</span>
          <input
            type="number"
            step="1"
            disabled={locked}
            value={adjustment}
            onChange={(e) => onChange("adjustment", e.target.value)}
          />
        </label>
        <div className="final">
          <span>Final Total</span>
          <b>{money(summary.total)}</b>
        </div>
      </div>
    </aside>
  );
}
