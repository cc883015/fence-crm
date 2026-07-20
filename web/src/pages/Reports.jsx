import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { exportCustomersExcel } from "../lib/excel.js";

export default function Reports() {
  const [sum, setSum] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    api.summary()
      .then(setSum)
      .catch((e) => setErr(String(e.message || e)));
  }, []);

  const exportBy = async (deposit, label) => {
    setBusy(label);
    try {
      const list = await api.customers(deposit);
      exportCustomersExcel(list, `nova-${label}.xlsx`);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy("");
    }
  };

  if (err && !sum) return <div className="err">{err}</div>;
  if (!sum) return <p className="muted">加载中…</p>;

  const maxSrc = Math.max(1, ...(sum.bySource || []).map((x) => x.n));
  const maxStyle = Math.max(1, ...(sum.byStyle || []).map((x) => x.n));

  return (
    <>
      <div className="section-head">
        <p className="ts-eyebrow">Reports · Export</p>
        <h2>报表与导出</h2>
      </div>

      <div className="statrow">
        {[
          [sum.total, "全部客户"],
          [sum.depNone, "未付定金"],
          [sum.depPaid, "已付定金"],
          [sum.full, "全款成交"],
        ].map(([n, l]) => (
          <div key={l} className="stat ts-glass">
            <div className="n">{n}</div>
            <div className="l">{l}</div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <button type="button" className="btn btn-primary" disabled={!!busy} onClick={() => exportBy("all", "all-customers")}>
          {busy === "all-customers" ? "导出中…" : "导出全部客户"}
        </button>
        <button type="button" className="btn btn-ghost ts-glass" disabled={!!busy} onClick={() => exportBy("none", "deposit-unpaid")}>
          导出未付定金
        </button>
        <button type="button" className="btn btn-ghost ts-glass" disabled={!!busy} onClick={() => exportBy("paid", "deposit-paid")}>
          导出已付定金
        </button>
        <button type="button" className="btn btn-ghost ts-glass" disabled={!!busy} onClick={() => exportBy("full", "paid-full")}>
          导出全款成交
        </button>
      </div>
      {err && <p className="err">{err}</p>}

      <div className="form-grid" style={{ marginTop: "1.5rem" }}>
        <div className="ts-glass quote-panel">
          <p className="ts-eyebrow">By source · 来源</p>
          <div className="bar-list" style={{ marginTop: "0.75rem" }}>
            {(sum.bySource || []).map((r) => (
              <div className="bar-row" key={r.source}>
                <span>{r.source}</span>
                <div className="bar"><i style={{ width: `${(r.n / maxSrc) * 100}%` }} /></div>
                <strong>{r.n}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="ts-glass quote-panel">
          <p className="ts-eyebrow">By style · 款式</p>
          <div className="bar-list" style={{ marginTop: "0.75rem" }}>
            {(sum.byStyle || []).map((r) => (
              <div className="bar-row" key={r.style}>
                <span>{r.style}</span>
                <div className="bar"><i style={{ width: `${(r.n / maxStyle) * 100}%` }} /></div>
                <strong>{r.n}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
