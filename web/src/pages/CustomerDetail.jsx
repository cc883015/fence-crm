import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { STAGES, STYLE_OPTIONS, stageColor } from "../data/products.js";
import { INTAKE_STEPS } from "../data/scripts.js";
import { exportOneCustomerExcel } from "../lib/excel.js";

function labelStyle(id) {
  return STYLE_OPTIONS.find((s) => s.id === id)?.en || id || "—";
}
function labelStyleZh(id) {
  return STYLE_OPTIONS.find((s) => s.id === id)?.zh || "";
}

export default function CustomerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [err, setErr] = useState("");
  const [stage, setStage] = useState("");

  const load = () => {
    api.customer(id)
      .then((d) => { setC(d); setStage(d.stage); setErr(""); })
      .catch((e) => setErr(String(e.message || e)));
  };
  useEffect(load, [id]);

  if (err) return <div className="err">{err}</div>;
  if (!c) return <p className="muted">加载中…</p>;

  const rows = [
    { n: "1", zh: "来源", en: "Source", v: `${c.source || "—"}` },
    { n: "2", zh: "服务区 / 长度", en: "Area / Length", v: `${c.service_area || "—"} · ${c.fence_length || "—"}` },
    { n: "3", zh: "电动门", en: "Gate", v: c.gate_required ? `Yes · ${c.gate_width || "?"}` : "No" },
    { n: "4", zh: "安装方式", en: "Install", v: `${c.install_type || "—"}${c.dual_estimate ? " · dual estimate" : ""}` },
    { n: "5", zh: "款式", en: "Style", v: `${labelStyle(c.fence_style)} / ${labelStyleZh(c.fence_style)}` },
    { n: "6", zh: "颜色", en: "Colour", v: c.color || "—" },
    { n: "7", zh: "斜坡 / 照片", en: "Slope / Photo", v: `${c.slope || "—"} · ${c.photo_note || "—"}` },
    { n: "8", zh: "联系人", en: "Contact", v: `${c.name} · ${c.phone} · ${c.email || "—"} · ${c.suburb || "—"}` },
    { n: "9", zh: "定金说明", en: "Deposit informed", v: c.deposit_informed ? "Yes · 已告知" : "No" },
  ];

  const saveStage = async () => {
    await api.updateCustomer(id, { ...c, stage });
    load();
  };

  const pay = async (type, amount) => {
    await api.createPayment({ customer_id: Number(id), type, amount, status: "paid", method: "payid" });
    load();
  };

  const remove = async () => {
    if (!confirm("确认删除该客户？")) return;
    await api.deleteCustomer(id);
    nav("/admin");
  };

  return (
    <div className="wizard">
      <div className="toolbar">
        <Link className="btn btn-ghost ts-glass" to="/admin">← 看板</Link>
        <button type="button" className="btn btn-primary" onClick={() => exportOneCustomerExcel(c)}>
          导出此客户 Excel
        </button>
        <button type="button" className="btn btn-danger btn-sm" onClick={remove}>删除</button>
      </div>

      <div className="ts-glass quote-panel" style={{ marginBottom: "1rem" }}>
        <p className="ts-eyebrow">Customer #{c.id}</p>
        <h2 style={{ margin: "0.3rem 0" }}>{c.name}</h2>
        <p className="muted">
          <i className="dot" style={{ background: stageColor(c.stage) }} />
          {STAGES.find(([s]) => s === c.stage)?.[1] || c.stage}
          {c.has_deposit ? " · 定金已付" : " · 未付定金"}
          {c.has_full ? " · 全款" : ""}
        </p>
        <div className="toolbar">
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            {STAGES.map(([s, l]) => <option key={s} value={s}>{l}</option>)}
          </select>
          <button type="button" className="btn btn-sm btn-primary" onClick={saveStage}>更新阶段</button>
          {!c.has_deposit && (
            <button type="button" className="btn btn-sm btn-primary" onClick={() => pay("deposit", 200)}>记 $200 定金</button>
          )}
          {!c.has_full && (
            <button type="button" className="btn btn-sm btn-ghost ts-glass" onClick={() => pay("full", c.latest_quote || 0)}>记全款</button>
          )}
        </div>
      </div>

      <h3>客户选项清单 · Choices (1–9)</h3>
      <div className="detail-grid" style={{ marginTop: "0.75rem" }}>
        {rows.map((r) => (
          <div key={r.n} className="detail-row ts-glass-soft">
            <div className="num">{r.n}</div>
            <div>
              <strong>{r.zh}</strong>
              <span className="muted"> · {r.en}</span>
              <div style={{ marginTop: 4 }}>{r.v}</div>
            </div>
          </div>
        ))}
      </div>

      {c.notes && (
        <div className="ts-glass quote-panel" style={{ marginTop: "1rem" }}>
          <p className="ts-eyebrow">Notes</p>
          <p>{c.notes}</p>
        </div>
      )}

      <div className="ts-glass quote-panel" style={{ marginTop: "1rem" }}>
        <p className="ts-eyebrow">Suggested scripts · 可用话术</p>
        {INTAKE_STEPS.slice(0, 4).map((s) => (
          <div key={s.id} className="script-box" style={{ marginTop: 8 }}>
            <p className="zh">{s.num}. {s.script_zh}</p>
            <p className="en">{s.script_en}</p>
          </div>
        ))}
      </div>

      {c.payments?.length > 0 && (
        <div className="ts-glass quote-panel" style={{ marginTop: "1rem" }}>
          <p className="ts-eyebrow">Payments</p>
          {c.payments.map((p) => (
            <p key={p.id} className="muted">{p.type} · ${p.amount} · {p.status} · {p.paid_at || p.created_at}</p>
          ))}
        </div>
      )}
    </div>
  );
}
