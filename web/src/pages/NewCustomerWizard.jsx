import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { INTAKE_STEPS } from "../data/scripts.js";
import { STYLE_OPTIONS, CONTACT } from "../data/products.js";
import { api } from "../lib/api.js";

const empty = {
  source: "phone",
  service_area: "",
  fence_length: "",
  gate_required: false,
  gate_width: "",
  install_type: "",
  dual_estimate: false,
  fence_style: "",
  color: "",
  slope: "unknown",
  photo_note: "",
  name: "",
  phone: "",
  email: "",
  suburb: "",
  notes: "",
  deposit_informed: false,
};

function Script({ zh, en }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(en);
    } catch { /* ignore */ }
  };
  return (
    <div className="script-box">
      <p className="zh">{zh}</p>
      <p className="en">{en}</p>
      <button type="button" className="btn btn-ghost btn-sm" onClick={copy} style={{ marginTop: 8 }}>
        Copy English · 复制英文
      </button>
    </div>
  );
}

export default function NewCustomerWizard() {
  const nav = useNavigate();
  const [data, setData] = useState(empty);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const cur = INTAKE_STEPS[step];

  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      const intake_answers = {
        steps: INTAKE_STEPS.map((s) => ({
          num: s.num,
          id: s.id,
          title_zh: s.title_zh,
          title_en: s.title_en,
        })),
        values: { ...data },
      };
      const r = await api.createCustomer({
        ...data,
        stage: "new",
        intake_answers,
      });
      nav(`/admin/customers/${r.id}`);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wizard">
      <div className="section-head">
        <p className="ts-eyebrow">Guided intake · 电话 / 网上</p>
        <h2>新客户引导 · New Customer</h2>
        <p className="muted">按序号边问边填；英文话术可一键复制发给客户。</p>
      </div>

      <div className="toolbar">
        {INTAKE_STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`btn btn-sm ${i === step ? "btn-primary" : "btn-ghost ts-glass"}`}
            onClick={() => setStep(i)}
          >
            {s.num}
          </button>
        ))}
      </div>

      <div className="wizard-step ts-glass">
        <div className="step-num">STEP {cur.num}</div>
        <h3 style={{ margin: "0.35rem 0" }}>{cur.title_zh} · {cur.title_en}</h3>
        <Script zh={cur.script_zh} en={cur.script_en} />
        {cur.script_en2 && <Script zh={cur.script_zh2 || ""} en={cur.script_en2} />}

        {cur.type === "choice" && (
          <div className="choice-grid">
            {cur.options.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`choice ${data[cur.id === "source" ? "source" : "color"] === o.value ? "on" : ""}`}
                onClick={() => set(cur.id === "source" ? "source" : "color", o.value)}
              >
                <strong>{o.zh}</strong>
                <span>{o.en}</span>
              </button>
            ))}
          </div>
        )}

        {cur.type === "area_length" && (
          <>
            <div className="choice-grid">
              {CONTACT.areas.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`choice ${data.service_area === a ? "on" : ""}`}
                  onClick={() => set("service_area", a)}
                >
                  <strong>{a}</strong>
                  <span>服务区域</span>
                </button>
              ))}
            </div>
            <div className="field" style={{ marginTop: "0.85rem" }}>
              <label>Approx. yard length · 院子大概长度</label>
              <input
                value={data.fence_length}
                onChange={(e) => set("fence_length", e.target.value)}
                placeholder="e.g. 22m / 30 metres"
              />
            </div>
          </>
        )}

        {cur.type === "gate" && (
          <>
            <div className="choice-grid">
              {[
                { v: false, zh: "不需要电动门", en: "No automatic gate" },
                { v: true, zh: "需要电动门", en: "Yes, automatic gate" },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  className={`choice ${data.gate_required === o.v ? "on" : ""}`}
                  onClick={() => set("gate_required", o.v)}
                >
                  <strong>{o.zh}</strong>
                  <span>{o.en}</span>
                </button>
              ))}
            </div>
            {data.gate_required && (
              <div className="field" style={{ marginTop: "0.85rem" }}>
                <label>Gate width · 门宽（多数车道 4–6m）</label>
                <input value={data.gate_width} onChange={(e) => set("gate_width", e.target.value)} placeholder="e.g. 5m" />
              </div>
            )}
          </>
        )}

        {cur.type === "install" && (
          <>
            <div className="choice-grid">
              {[
                { v: "brick", zh: "砌砖 + 围栏", en: "Brick wall + fencing on top" },
                { v: "ground", zh: "围栏直接落地", en: "Fence installed to the ground" },
                { v: "materials", zh: "只要材料+图纸", en: "Materials + install drawings only" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  className={`choice ${data.install_type === o.v ? "on" : ""}`}
                  onClick={() => set("install_type", o.v)}
                >
                  <strong>{o.zh}</strong>
                  <span>{o.en}</span>
                </button>
              ))}
            </div>
            <label style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={data.dual_estimate}
                onChange={(e) => set("dual_estimate", e.target.checked)}
              />
              要两套估价对比 · Two estimates (with / without brick)
            </label>
          </>
        )}

        {cur.type === "style" && (
          <div className="choice-grid">
            {STYLE_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`choice ${data.fence_style === o.id ? "on" : ""}`}
                onClick={() => set("fence_style", o.id)}
              >
                <strong>{o.en}</strong>
                <span>{o.zh}</span>
              </button>
            ))}
          </div>
        )}

        {cur.type === "slope" && (
          <>
            <div className="choice-grid">
              {[
                { v: "no", zh: "没有斜坡", en: "No slope" },
                { v: "yes", zh: "有斜坡", en: "On a slope" },
                { v: "unknown", zh: "暂不清楚", en: "Not sure yet" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  className={`choice ${data.slope === o.v ? "on" : ""}`}
                  onClick={() => set("slope", o.v)}
                >
                  <strong>{o.zh}</strong>
                  <span>{o.en}</span>
                </button>
              ))}
            </div>
            <div className="field" style={{ marginTop: "0.85rem" }}>
              <label>Photo note · 照片备注（可写「稍后发」）</label>
              <input value={data.photo_note} onChange={(e) => set("photo_note", e.target.value)} />
            </div>
          </>
        )}

        {cur.type === "contact" && (
          <div className="form-grid">
            <div className="field">
              <label>Name · 姓名 *</label>
              <input required value={data.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="field">
              <label>Phone · 电话 *</label>
              <input required value={data.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="field">
              <label>Email · 邮箱</label>
              <input value={data.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="field">
              <label>Suburb · 区</label>
              <input value={data.suburb} onChange={(e) => set("suburb", e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Notes · 备注</label>
              <textarea value={data.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>
        )}

        {cur.type === "deposit" && (
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
            <input
              type="checkbox"
              checked={data.deposit_informed}
              onChange={(e) => set("deposit_informed", e.target.checked)}
            />
            已向客户说明 $200 定金与价保 · Deposit &amp; price-match explained
          </label>
        )}
      </div>

      <div className="toolbar">
        <button type="button" className="btn btn-ghost ts-glass" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          ← 上一步
        </button>
        {step < INTAKE_STEPS.length - 1 ? (
          <button type="button" className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
            下一步 →
          </button>
        ) : (
          <button type="button" className="btn btn-primary" disabled={busy || !data.name || !data.phone} onClick={save}>
            {busy ? "保存中…" : "保存客户 · Save to board"}
          </button>
        )}
      </div>
      {err && <p className="err">{err}</p>}
    </div>
  );
}
