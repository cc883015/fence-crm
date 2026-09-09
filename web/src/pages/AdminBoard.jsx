import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { STAGES, stageColor } from "../data/products.js";
import { exportCustomersExcel } from "../lib/excel.js";

export default function AdminBoard() {
  const nav = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = () => {
    setLoading(true);
    api.customers()
      .then((cs) => { setCustomers(cs); setErr(""); })
      .catch((e) => setErr(String(e.message || e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => customers.filter((c) => {
    if (filter === "deposit_none") return !c.has_deposit && !c.has_full && c.stage !== "lost";
    if (filter === "deposit_paid") return c.has_deposit && !c.has_full;
    if (filter === "full") return c.has_full;
    return true;
  }), [customers, filter]);

  const byStage = useMemo(() => {
    const m = {};
    STAGES.forEach(([id]) => { m[id] = []; });
    filtered.forEach((c) => { if (m[c.stage]) m[c.stage].push(c); else m.new.push(c); });
    return m;
  }, [filtered]);

  const stats = useMemo(() => ({
    total: customers.length,
    depNone: customers.filter((c) => !c.has_deposit && !c.has_full && c.stage !== "lost").length,
    depPaid: customers.filter((c) => c.has_deposit && !c.has_full).length,
    full: customers.filter((c) => c.has_full).length,
  }), [customers]);

  const markDeposit = async (c, e) => {
    e.stopPropagation();
    await api.createPayment({ customer_id: c.id, type: "deposit", amount: 200, status: "paid", method: "payid" });
    load();
  };

  if (loading) return <p className="muted">加载中…</p>;
  if (err) return <div className="ts-glass quote-panel err">连不上 API：{err}</div>;

  return (
    <>
      <div className="toolbar">
        <Link className="btn btn-primary" to="/admin/new">+ 新客户 · New Customer</Link>
        <Link className="btn btn-ghost ts-glass" to="/admin/quote">快速报价 · Quick Quote</Link>
        <button type="button" className="btn btn-ghost ts-glass" onClick={() => exportCustomersExcel(filtered, `nova-board-${filter}.xlsx`)}>
          导出当前列表 Excel
        </button>
      </div>

      <div className="statrow">
        {[
          ["all", stats.total, "全部客户", "#3a3a3a"],
          ["deposit_none", stats.depNone, "未付定金", "#d4692f"],
          ["deposit_paid", stats.depPaid, "已付定金", "#2f9e6b"],
          ["full", stats.full, "全款成交", "#22773f"],
        ].map(([key, n, label, tone]) => (
          <button
            key={key}
            type="button"
            className={`stat ts-glass ${filter === key ? "on" : ""}`}
            onClick={() => setFilter(key)}
          >
            <div className="n" style={{ color: tone }}>{n}</div>
            <div className="l">{label}</div>
          </button>
        ))}
      </div>

      <div className="board">
        {STAGES.map(([id, label]) => (
          <div key={id} className="col ts-glass-soft">
            <div className="col-h">
              <span><i className="dot" style={{ background: stageColor(id) }} />{label}</span>
              <span className="muted">{byStage[id]?.length || 0}</span>
            </div>
            {(byStage[id] || []).map((c) => (
              <div key={c.id} className="card-c" onClick={() => nav(`/admin/customers/${c.id}`)} role="button" tabIndex={0}>
                <h4>{c.name || "未命名"}</h4>
                <p>{c.phone} · {c.suburb || "—"}</p>
                <p>
                  {c.source || "—"} · {c.fence_style || "款式未定"}
                  {c.has_deposit ? " · 定金✓" : ""}
                </p>
                {!c.has_deposit && c.stage !== "lost" && (
                  <button type="button" className="btn btn-sm btn-primary" style={{ marginTop: 6 }} onClick={(e) => markDeposit(c, e)}>
                    记 $200 定金
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
