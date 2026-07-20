import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { stageColor } from "../data/products.js";
import { exportCustomersExcel } from "../lib/excel.js";
import { fuzzyCustomer } from "../lib/fuzzy.js";

export default function Enquiries() {
  const nav = useNavigate();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [q, setQ] = useState("");

  const load = () => {
    setLoading(true);
    api.customers()
      .then((cs) => {
        setAll(cs.filter((c) => c.stage === "enquiry" || (c.source === "website" && c.stage === "new")));
        setErr("");
      })
      .catch((e) => setErr(String(e.message || e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const list = useMemo(() => all.filter((c) => fuzzyCustomer(c, q)), [all, q]);

  const promote = async (c, e) => {
    e.stopPropagation();
    setBusyId(c.id);
    try {
      await api.updateCustomer(c.id, {
        ...c,
        stage: "new",
        source: c.source || "website",
        intake_answers: c.intake_answers || {},
      });
      load();
    } catch (ex) {
      setErr(String(ex.message || ex));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="muted">加载中…</p>;
  if (err) return <div className="ts-glass quote-panel err">{err}</div>;

  return (
    <div className="orders-main">
      <div className="orders-head">
        <div>
          <p className="ts-eyebrow">Website quotes · 官网资讯</p>
          <h2 style={{ margin: "0.2rem 0 0" }}>
            新资讯订单
            <span className="muted" style={{ fontSize: "1rem", fontWeight: 500 }}> · {list.length}</span>
          </h2>
          <p className="muted">首页报价表单提交会出现在这里，不会混入左侧「订单」列表。确认后可「转入订单」。</p>
        </div>
        <div className="toolbar" style={{ margin: 0 }}>
          <button
            type="button"
            className="btn btn-ghost ts-glass"
            onClick={() => exportCustomersExcel(list, "nova-enquiries.xlsx")}
          >
            导出 Excel
          </button>
        </div>
      </div>

      <div className="search-bar ts-glass">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索客户姓名 / 电话 / 邮箱 / 区（模糊）…"
          aria-label="Search enquiries"
        />
        {q && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setQ("")}>
            清除
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="ts-glass quote-panel">
          <p className="muted">{q ? `未找到匹配「${q}」的资讯 · No matches.` : "暂无新的官网资讯订单。"}</p>
        </div>
      ) : (
        <div className="order-table ts-glass">
          <div className="order-row order-head">
            <span>客户 / 联系</span>
            <span>地区 / 长度</span>
            <span>款式 / 颜色</span>
            <span>留言</span>
            <span>时间</span>
            <span></span>
          </div>
          {list.map((c) => {
            const msg = c.intake_answers?.message || c.notes || "—";
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
                  <span className="muted">{c.phone || "—"}</span>
                  <br />
                  <span className="muted">{c.email || "—"}</span>
                </span>
                <span>
                  {c.suburb || c.service_area || "—"}
                  <br />
                  <span className="muted">{c.fence_length || "—"}</span>
                </span>
                <span>
                  {c.fence_style || "—"}
                  <br />
                  <span className="muted">{c.color || "—"}</span>
                </span>
                <span className="muted" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {msg}
                </span>
                <span className="muted">{(c.updated_at || c.created_at || "").slice(0, 16)}</span>
                <span className="order-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    disabled={busyId === c.id}
                    onClick={(e) => promote(c, e)}
                  >
                    {busyId === c.id ? "…" : "转入订单"}
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => nav(`/admin/customers/${c.id}`)}>
                    详情
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
