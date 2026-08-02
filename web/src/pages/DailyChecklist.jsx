import React, { useEffect, useState } from "react";

const STORAGE_KEY = "nova_daily_checklist_v1";

const ITEMS = [
  { id: "enquiries", zh: "查看新资讯 / 官网报价，及时回电", en: "Check Enquiries & call back" },
  { id: "measure", zh: "确认今日/本周 周三·周六 测量行程", en: "Confirm Wed/Sat measure runs" },
  { id: "deposit", zh: "跟进未付定金客户", en: "Chase unpaid deposits" },
  { id: "quotes", zh: "发出或跟进待确认报价", en: "Send / follow up quotes" },
  { id: "stock", zh: "核对常用款式现货与颜色", en: "Check stock & colours" },
  { id: "messages", zh: "回复未读短信 / WhatsApp / 微信", en: "Clear unread messages" },
  { id: "showroom", zh: "展厅样板与名片整理", en: "Showroom tidy + cards" },
  { id: "tomorrow", zh: "安排明日上门 / 送货备注", en: "Plan tomorrow visits / delivery notes" },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function DailyChecklist() {
  const [done, setDone] = useState({});
  const [day, setDay] = useState(todayKey());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      const d = todayKey();
      setDay(d);
      setDone(data[d] || {});
    } catch {
      setDone({});
    }
  }, []);

  const persist = (next) => {
    setDone(next);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      data[day || todayKey()] = next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  };

  const toggle = (id) => {
    persist({ ...done, [id]: !done[id] });
  };

  const reset = () => persist({});

  const total = ITEMS.length;
  const count = ITEMS.filter((i) => done[i.id]).length;

  return (
    <div className="orders-main">
      <div className="orders-head">
        <div>
          <p className="ts-eyebrow">Daily ops · 每日必查</p>
          <h2 style={{ margin: "0.2rem 0 0" }}>
            每日必查清单
            <span className="muted" style={{ fontSize: "1rem", fontWeight: 500 }}>
              {" "}· {count}/{total} · {day}
            </span>
          </h2>
          <p className="muted">开店 / 接电话前过一遍。勾选保存在本机，按日期重置。</p>
        </div>
        <button type="button" className="btn btn-ghost ts-glass" onClick={reset}>
          清空今日勾选
        </button>
      </div>

      <div className="ts-glass checklist-panel">
        {ITEMS.map((item) => (
          <label key={item.id} className={`checklist-item ${done[item.id] ? "on" : ""}`}>
            <input
              type="checkbox"
              checked={!!done[item.id]}
              onChange={() => toggle(item.id)}
            />
            <span>
              <strong>{item.zh}</strong>
              <em>{item.en}</em>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
