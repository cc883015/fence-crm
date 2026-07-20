import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { CONTACT, STAGES, STYLE_OPTIONS, stageColor } from "../data/products.js";
import { exportOneCustomerExcel } from "../lib/excel.js";

const SOURCES = ["website", "phone", "facebook", "referral", "walk_in"];
const INSTALLS = [
  { v: "", label: "—" },
  { v: "brick", label: "Brick wall + fence · 砌砖+围栏" },
  { v: "ground", label: "Fence to ground · 直接落地" },
  { v: "materials", label: "Materials only · 只要材料" },
];

function emptyForm() {
  return {
    name: "", phone: "", email: "", suburb: "", address: "",
    stage: "new", notes: "", source: "",
    fence_length: "", gate_required: false, gate_width: "",
    install_type: "", fence_style: "", color: "",
    slope: "unknown", dual_estimate: false, photo_note: "",
    deposit_informed: false, service_area: "",
    intake_answers: {},
  };
}

function fromCustomer(c) {
  return {
    name: c.name || "",
    phone: c.phone || "",
    email: c.email || "",
    suburb: c.suburb || "",
    address: c.address || "",
    stage: c.stage || "new",
    notes: c.notes || "",
    source: c.source || "",
    fence_length: c.fence_length || "",
    gate_required: !!c.gate_required,
    gate_width: c.gate_width || "",
    install_type: c.install_type || "",
    fence_style: c.fence_style || "",
    color: c.color || "",
    slope: c.slope || "unknown",
    dual_estimate: !!c.dual_estimate,
    photo_note: c.photo_note || "",
    deposit_informed: !!c.deposit_informed,
    service_area: c.service_area || "",
    intake_answers: c.intake_answers || {},
  };
}

export default function CustomerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.customer(id)
      .then((d) => {
        setC(d);
        setForm(fromCustomer(d));
        setErr("");
      })
      .catch((e) => setErr(String(e.message || e)));
  };
  useEffect(load, [id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    setMsg("");
    try {
      await api.updateCustomer(id, form);
      setMsg("已保存 · Saved");
      load();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
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

  if (err && !c) return <div className="err">{err}</div>;
  if (!c) return <p className="muted">加载中…</p>;

  const websiteSnap = c.intake_answers?.channel === "website" ? c.intake_answers : null;

  return (
    <div className="wizard">
      <div className="toolbar">
        <Link className="btn btn-ghost ts-glass" to="/admin">← 看板</Link>
        <button type="button" className="btn btn-primary" onClick={() => exportOneCustomerExcel({ ...c, ...form })}>
          导出此客户 Excel
        </button>
        <button type="button" className="btn btn-danger btn-sm" onClick={remove}>删除</button>
      </div>

      <div className="ts-glass quote-panel" style={{ marginBottom: "1rem" }}>
        <p className="ts-eyebrow">Customer #{c.id}</p>
        <h2 style={{ margin: "0.3rem 0" }}>{form.name || "Unnamed"}</h2>
        <p className="muted">
          <i className="dot" style={{ background: stageColor(form.stage) }} />
          {STAGES.find(([s]) => s === form.stage)?.[1] || form.stage}
          {c.has_deposit ? " · 定金已付" : " · 未付定金"}
          {c.has_full ? " · 全款" : ""}
          {form.source ? ` · ${form.source}` : ""}
        </p>
        <div className="toolbar">
          <select value={form.stage} onChange={(e) => set("stage", e.target.value)}>
            {STAGES.map(([s, l]) => <option key={s} value={s}>{l}</option>)}
          </select>
          <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={save}>
            {busy ? "保存中…" : "保存全部修改 · Save"}
          </button>
          {!c.has_deposit && (
            <button type="button" className="btn btn-sm btn-primary" onClick={() => pay("deposit", 200)}>记 $200 定金</button>
          )}
          {!c.has_full && (
            <button type="button" className="btn btn-sm btn-ghost ts-glass" onClick={() => pay("full", c.latest_quote || 0)}>记全款</button>
          )}
        </div>
        {msg && <p className="ok" style={{ marginTop: 8 }}>{msg}</p>}
        {err && <p className="err" style={{ marginTop: 8 }}>{err}</p>}
      </div>

      {websiteSnap && (
        <div className="ts-glass quote-panel" style={{ marginBottom: "1rem" }}>
          <p className="ts-eyebrow">Website quote snapshot · 官网报价原文</p>
          <div className="detail-grid" style={{ marginTop: 8 }}>
            {[
              ["Style", websiteSnap.fence_type],
              ["Colour", websiteSnap.color],
              ["Length", websiteSnap.fence_length],
              ["Suburb", websiteSnap.suburb],
              ["Gate", websiteSnap.automatic_gate ? "Yes" : "No"],
              ["Message", websiteSnap.message],
              ["Submitted", websiteSnap.submitted_at],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="detail-row ts-glass-soft">
                <div className="num">·</div>
                <div><strong>{k}</strong><div style={{ marginTop: 4 }}>{String(v)}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3>客户选项清单 · Editable choices</h3>
      <p className="muted">可随时修改，保存后写入历史记录。</p>

      <div className="ts-glass quote-panel" style={{ marginTop: "0.75rem" }}>
        <div className="form-grid">
          <div className="field">
            <label>1. Source · 来源</label>
            <select value={form.source} onChange={(e) => set("source", e.target.value)}>
              <option value="">—</option>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>2. Service area · 服务区</label>
            <select value={form.service_area} onChange={(e) => set("service_area", e.target.value)}>
              <option value="">—</option>
              {CONTACT.areas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="field">
            <label>2. Length · 长度（可手动填写）</label>
            <input value={form.fence_length} onChange={(e) => set("fence_length", e.target.value)} placeholder="直接输入，例如 25m" />
          </div>
          <div className="field">
            <label>3. Automatic gate · 电动门</label>
            <select
              value={form.gate_required ? "yes" : "no"}
              onChange={(e) => set("gate_required", e.target.value === "yes")}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="field">
            <label>3. Gate width · 门宽</label>
            <input value={form.gate_width} onChange={(e) => set("gate_width", e.target.value)} placeholder="4–6m" disabled={!form.gate_required} />
          </div>
          <div className="field">
            <label>4. Install type · 安装方式</label>
            <select value={form.install_type} onChange={(e) => set("install_type", e.target.value)}>
              {INSTALLS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>4. Dual estimate · 两套估价</label>
            <select
              value={form.dual_estimate ? "yes" : "no"}
              onChange={(e) => set("dual_estimate", e.target.value === "yes")}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="field">
            <label>5. Style · 款式</label>
            <select value={form.fence_style} onChange={(e) => set("fence_style", e.target.value)}>
              <option value="">—</option>
              {STYLE_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.en} / {s.zh}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>6. Colour · 颜色</label>
            <select value={form.color} onChange={(e) => set("color", e.target.value)}>
              <option value="">—</option>
              <option>Black</option>
              <option>Grey</option>
            </select>
          </div>
          <div className="field">
            <label>7. Slope · 斜坡</label>
            <select value={form.slope} onChange={(e) => set("slope", e.target.value)}>
              <option value="unknown">Unknown</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="field">
            <label>7. Photo note · 照片备注</label>
            <input value={form.photo_note} onChange={(e) => set("photo_note", e.target.value)} />
          </div>
          <div className="field">
            <label>8. Name · 姓名</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="field">
            <label>8. Phone · 电话</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="field">
            <label>8. Email</label>
            <input value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="field">
            <label>8. Suburb</label>
            <input value={form.suburb} onChange={(e) => set("suburb", e.target.value)} />
          </div>
          <div className="field">
            <label>9. Deposit informed · 已告知定金</label>
            <select
              value={form.deposit_informed ? "yes" : "no"}
              onChange={(e) => set("deposit_informed", e.target.value === "yes")}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Notes · 备注</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>
            {busy ? "保存中…" : "保存修改 · Save changes"}
          </button>
        </div>
      </div>

      <div className="ts-glass quote-panel" style={{ marginTop: "1rem" }}>
        <p className="ts-eyebrow">History · 历史记录</p>
        <div className="history-list" style={{ marginTop: "0.75rem" }}>
          {(c.activities || []).length === 0 && <p className="muted">暂无记录</p>}
          {(c.activities || []).map((a) => (
            <div key={a.id} className="history-item">
              <div className="history-meta">
                <span className="chip">{a.type}</span>
                <span className="muted">{a.created_at}</span>
              </div>
              <p style={{ margin: "0.35rem 0 0" }}>{a.content}</p>
            </div>
          ))}
        </div>
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
