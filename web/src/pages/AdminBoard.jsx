import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { STAGES, stageColor } from "../data/products.js";
import { exportCustomersExcel } from "../lib/excel.js";
import { fuzzyCustomer } from "../lib/fuzzy.js";

const QUICK = [
  { id: "all", en: "All orders", zh: "全部订单" },
  { id: "deposit_none", en: "No deposit", zh: "未付定金" },
  { id: "deposit_paid", en: "Deposit paid", zh: "已付定金" },
  { id: "full", en: "Paid in full", zh: "全款成交" },
];

const STAGE_NAV = [
  { id: "all", en: "All orders", zh: "全部订单" },
  ...STAGES.filter(([id]) => id !== "enquiry").map(([id, zh]) => ({
    id,
    zh,
    en: ({
      new: "New enquiry",
      quoted: "Quoted",
      style: "Style confirmed",
      visit: "Site visit",
      deposit_wait: "Awaiting deposit",
      deposit_paid: "Deposit paid",
      measured: "Measured",
      paid_full: "Paid in full",
      lost: "Lost",
    })[id] || id,
  })),
];

function matchesFilter(c, filter) {
  // Website enquiries live on a separate page — never mix into Orders
  if (c.stage === "enquiry") return false;
  if (filter === "all") return true;
  if (filter === "deposit_none") return !c.has_deposit && !c.has_full && c.stage !== "lost";
  if (filter === "deposit_paid") return c.has_deposit && !c.has_full;
  if (filter === "full") return c.has_full;
  return c.stage === filter;
}

export default function AdminBoard() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const filter = params.get("status") || "all";
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [lengthEdit, setLengthEdit] = useState({}); // id -> value while editing
  const [savingLen, setSavingLen] = useState(null);

  const setFilter = (id) => {
    if (id === "all") setParams({});
    else setParams({ status: id });
  };

  const load = () => {
    setLoading(true);
    api.customers()
      .then((cs) => { setCustomers(cs); setErr(""); })
      .catch((e) => setErr(String(e.message || e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const counts = useMemo(() => {
    const pipeline = customers.filter((c) => c.stage !== "enquiry");
    const m = { all: pipeline.length };
    QUICK.forEach(({ id }) => {
      if (id === "all") return;
      m[id] = pipeline.filter((c) => matchesFilter(c, id)).length;
    });
    STAGES.filter(([id]) => id !== "enquiry").forEach(([id]) => {
      m[id] = pipeline.filter((c) => c.stage === id).length;
    });
    return m;
  }, [customers]);

  const list = useMemo(
    () => customers.filter((c) => matchesFilter(c, filter) && fuzzyCustomer(c, q)),
    [customers, filter, q]
  );

  const current = STAGE_NAV.find((s) => s.id === filter)
    || QUICK.find((s) => s.id === filter)
    || STAGE_NAV[0];

  const markDeposit = async (c, e) => {
    e.stopPropagation();
    await api.createPayment({ customer_id: c.id, type: "deposit", amount: 200, status: "paid", method: "payid" });
    load();
  };

  const saveLength = async (c, e) => {
    e.stopPropagation();
    const val = lengthEdit[c.id] ?? c.fence_length ?? "";
    setSavingLen(c.id);
    try {
      await api.updateCustomer(c.id, {
        ...c,
        fence_length: val,
        intake_answers: c.intake_answers || {},
      });
      setLengthEdit((m) => {
        const n = { ...m };
        delete n[c.id];
        return n;
      });
      load();
    } catch (ex) {
      setErr(String(ex.message || ex));
    } finally {
      setSavingLen(null);
    }
  };

  if (loading) return <p className="muted">加载中…</p>;
  if (err) return <div className="ts-glass quote-panel err">连不上 API：{err}</div>;

  return (
    <div className="admin-orders">
      <aside className="status-nav ts-glass">
        <p className="ts-eyebrow">Orders · 订单状态</p>
        <div className="status-group">
          <p className="status-group-title">Overview · 总览</p>
          {QUICK.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`status-link ${filter === s.id ? "on" : ""}`}
              onClick={() => setFilter(s.id)}
            >
              <span>{s.zh}</span>
              <span className="status-count">{counts[s.id] || 0}</span>
            </button>
          ))}
        </div>
        <div className="status-group">
          <p className="status-group-title">By stage · 按阶段</p>
          {STAGES.filter(([id]) => id !== "enquiry").map(([id, zh]) => (
            <button
              key={id}
              type="button"
              className={`status-link ${filter === id ? "on" : ""}`}
              onClick={() => setFilter(id)}
            >
              <span>
                <i className="dot" style={{ background: stageColor(id) }} />
                {zh}
              </span>
              <span className="status-count">{counts[id] || 0}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="orders-main">
        <div className="orders-head">
          <div>
            <p className="ts-eyebrow">{current.en || "Orders"}</p>
            <h2 style={{ margin: "0.2rem 0 0" }}>
              {current.zh}
              <span className="muted" style={{ fontSize: "1rem", fontWeight: 500 }}> · {list.length}</span>
            </h2>
          </div>
          <div className="toolbar" style={{ margin: 0 }}>
            <Link className="btn btn-primary" to="/admin/new">+ 新客户</Link>
            <button
              type="button"
              className="btn btn-ghost ts-glass"
              onClick={() => exportCustomersExcel(list, `nova-${filter}.xlsx`)}
            >
              导出本页 Excel
            </button>
          </div>
        </div>

        <div className="search-bar ts-glass">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索客户姓名 / 电话 / 邮箱 / 区（模糊）…"
            aria-label="Search customers"
          />
          {q && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setQ("")}>
              清除
            </button>
          )}
        </div>

        {list.length === 0 ? (
          <div className="ts-glass quote-panel">
            <p className="muted">
              {q
                ? `未找到匹配「${q}」的客户 · No matches.`
                : "此状态下暂无订单 · No orders in this status."}
            </p>
          </div>
        ) : (
          <div className="order-table ts-glass">
            <div className="order-row order-head">
              <span>客户</span>
              <span>来源 / 款式</span>
              <span>长度 Length</span>
              <span>阶段</span>
              <span>定金</span>
              <span></span>
            </div>
            {list.map((c) => {
              const stageLabel = STAGES.find(([s]) => s === c.stage)?.[1] || c.stage;
              const lenVal = lengthEdit[c.id] !== undefined ? lengthEdit[c.id] : (c.fence_length || "");
              const dirty = lengthEdit[c.id] !== undefined && lengthEdit[c.id] !== (c.fence_length || "");
              return (
                <div
                  key={c.id}
                  className="order-row"
                  onClick={() => nav(`/admin/customers/${c.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <span>
                    <strong>{c.name || "未命名"}</strong>
                    <br />
                    <span className="muted">{c.phone || "—"} · {c.suburb || "—"}</span>
                  </span>
                  <span>
                    {c.source || "—"}
                    <br />
                    <span className="muted">{c.fence_style || "款式未定"}{c.color ? ` · ${c.color}` : ""}</span>
                  </span>
                  <span className="length-cell" onClick={(e) => e.stopPropagation()}>
                    <input
                      className="length-input"
                      value={lenVal}
                      placeholder="如 25m"
                      onChange={(e) => setLengthEdit((m) => ({ ...m, [c.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveLength(c, e);
                      }}
                    />
                    {dirty && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={savingLen === c.id}
                        onClick={(e) => saveLength(c, e)}
                      >
                        {savingLen === c.id ? "…" : "存"}
                      </button>
                    )}
                  </span>
                  <span>
                    <i className="dot" style={{ background: stageColor(c.stage) }} />
                    {stageLabel}
                  </span>
                  <span>
                    {c.has_full ? "全款✓" : c.has_deposit ? "定金✓" : "未付"}
                  </span>
                  <span className="order-actions" onClick={(e) => e.stopPropagation()}>
                    {!c.has_deposit && c.stage !== "lost" && (
                      <button type="button" className="btn btn-sm btn-primary" onClick={(e) => markDeposit(c, e)}>
                        $200
                      </button>
                    )}
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => nav(`/admin/customers/${c.id}`)}>
                      详情
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
