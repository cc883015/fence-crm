import React, { useEffect, useState, useMemo } from "react";
import { api } from "../lib/api.js";

const STAGES = [
  ["new", "新咨询"], ["quoted", "已发报价"], ["style", "已确认款式"],
  ["visit", "已约上门"], ["deposit_wait", "待收定金"], ["deposit_paid", "已付定金"],
  ["measured", "已测量"], ["paid_full", "全款成交"], ["lost", "已流失"],
];
const stageColor = (id) => ({
  new: "#8896a6", quoted: "#3f7fbf", style: "#6b5bd2", visit: "#c98a2b",
  deposit_wait: "#d4692f", deposit_paid: "#2f9e6b", measured: "#1f8f8a",
  paid_full: "#22773f", lost: "#9a9a9a",
}[id] || "#888");

export default function Board() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([api.customers(), api.products()])
      .then(([cs, ps]) => { setCustomers(cs); setProducts(ps); setErr(""); })
      .catch((e) => setErr(String(e)))
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
    const m = {}; STAGES.forEach(([id]) => (m[id] = []));
    filtered.forEach((c) => { if (m[c.stage]) m[c.stage].push(c); });
    return m;
  }, [filtered]);

  const stats = useMemo(() => ({
    total: customers.length,
    depNone: customers.filter((c) => !c.has_deposit && !c.has_full && c.stage !== "lost").length,
    depPaid: customers.filter((c) => c.has_deposit && !c.has_full).length,
    full: customers.filter((c) => c.has_full).length,
  }), [customers]);

  if (loading) return <div className="wrap"><p className="muted">加载中…</p></div>;
  if (err) return <div className="wrap"><div className="errbox">连不上 API：{err}<br/>确认后端已启动（npm run dev），且数据库已建表 + 灌种子。</div></div>;

  return (
    <div className="wrap">
      <div className="statrow">
        <Stat n={stats.total} label="全部客户" on={filter==="all"} onClick={() => setFilter("all")} tone="#3a3a3a" />
        <Stat n={stats.depNone} label="未付定金" on={filter==="deposit_none"} onClick={() => setFilter("deposit_none")} tone="#d4692f" />
        <Stat n={stats.depPaid} label="已付定金" on={filter==="deposit_paid"} onClick={() => setFilter("deposit_paid")} tone="#2f9e6b" />
        <Stat n={stats.full} label="已全款" on={filter==="full"} onClick={() => setFilter("full")} tone="#22773f" />
        <button className="addbtn" onClick={() => setEditing({ stage: "new" })}>＋ 新客户</button>
      </div>

      <div className="board">
        {STAGES.map(([id, label]) => (
          <div className="col" key={id}>
            <div className="colhead">
              <span className="dot" style={{ background: stageColor(id) }} />
              <span className="coltitle">{label}</span>
              <span className="colcount">{byStage[id].length}</span>
            </div>
            <div className="cards">
              {byStage[id].map((c) => (
                <div className="card" key={c.id} onClick={() => setEditing(c)}>
                  <div className="cardtop">
                    <strong>{c.name || "（未命名）"}</strong>
                    {c.has_deposit && <span className="badge paid">定金✓</span>}
                    {c.has_full && <span className="badge full">全款✓</span>}
                  </div>
                  <div className="cardmeta">{c.suburb || "—"}</div>
                  {c.latest_quote && <div className="cardquote">${c.latest_quote}</div>}
                </div>
              ))}
              {byStage[id].length === 0 && <div className="emptycol">—</div>}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal
          data={editing}
          products={products}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function Stat({ n, label, on, onClick, tone }) {
  return (
    <button className={"stat" + (on ? " on" : "")} style={{ "--tone": tone }} onClick={onClick}>
      <span className="stat-n">{n}</span><span className="stat-l">{label}</span>
    </button>
  );
}

function Modal({ data, products, onClose, onSaved }) {
  const [d, setD] = useState({ name: "", phone: "", email: "", suburb: "", stage: "new", notes: "", ...data });
  const [style, setStyle] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const prod = products.find((p) => p.slug === style);

  const save = async () => {
    setBusy(true);
    try {
      if (d.id) await api.updateCustomer(d.id, d);
      else await api.createCustomer(d);
      onSaved();
    } catch (e) { alert("保存失败：" + e); } finally { setBusy(false); }
  };
  const del = async () => { if (confirm("删除该客户？")) { await api.deleteCustomer(d.id); onSaved(); } };
  const markDeposit = async () => {
    await api.createPayment({ customer_id: d.id, type: "deposit", amount: 200, method: "payid", status: "paid" });
    alert("已记录 $200 定金"); onSaved();
  };
  const copy = () => { if (prod) { try { navigator.clipboard.writeText(prod.script_en); } catch(e){} alert("话术已复制"); } };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modalhead">
          <input className="nameinput" placeholder="客户名" value={d.name} onChange={(e) => set("name", e.target.value)} />
          <button className="closebtn" onClick={onClose}>✕</button>
        </div>
        <div className="mgrid">
          <L label="电话"><input value={d.phone||""} onChange={(e)=>set("phone",e.target.value)} /></L>
          <L label="邮箱"><input value={d.email||""} onChange={(e)=>set("email",e.target.value)} /></L>
          <L label="Suburb"><input value={d.suburb||""} onChange={(e)=>set("suburb",e.target.value)} /></L>
          <L label="流程阶段">
            <select value={d.stage} onChange={(e)=>set("stage",e.target.value)}>
              {STAGES.map(([id,label])=><option key={id} value={id}>{label}</option>)}
            </select>
          </L>
          <L label="围栏款式(看话术)">
            <select value={style} onChange={(e)=>setStyle(e.target.value)}>
              <option value="">选择</option>
              {products.map((p)=><option key={p.slug} value={p.slug}>{p.name_zh}</option>)}
            </select>
          </L>
        </div>
        <L label="备注"><textarea value={d.notes||""} onChange={(e)=>set("notes",e.target.value)} /></L>

        {prod && (
          <div className="scriptbox">
            <div className="scripthead"><span>📋 {prod.name_zh} · {prod.thickness}/{prod.gap}</span>
              <button className="copybtn" onClick={copy}>复制</button></div>
            <pre>{prod.script_en}</pre>
          </div>
        )}

        <div className="modalfoot">
          {d.id && <button className="delbtn" onClick={del}>删除</button>}
          {d.id && <button className="depbtn" onClick={markDeposit}>记录$200定金</button>}
          <div style={{ flex: 1 }} />
          <button className="cancelbtn" onClick={onClose}>取消</button>
          <button className="savebtn" onClick={save} disabled={busy}>{busy?"…":"保存"}</button>
        </div>
      </div>
    </div>
  );
}

function L({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}
