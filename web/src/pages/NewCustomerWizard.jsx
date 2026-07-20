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

function StepFields({ step, data, set }) {
  if (step.type === "choice") {
    const key = step.id === "source" ? "source" : "color";
    return (
      <div className="choice-grid">
        {step.options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`choice ${data[key] === o.value ? "on" : ""}`}
            onClick={() => set(key, o.value)}
          >
            <strong>{o.zh}</strong>
            <span>{o.en}</span>
          </button>
        ))}
      </div>
    );
  }

  if (step.type === "area_length") {
    return (
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
          <label>Length · 长度（可手动填写，如 25m）</label>
          <input
            value={data.fence_length}
            onChange={(e) => set("fence_length", e.target.value)}
            placeholder="直接输入，例如 22m / 30 metres"
            inputMode="text"
          />
        </div>
      </>
    );
  }

  if (step.type === "gate") {
    return (
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
    );
  }

  if (step.type === "install") {
    return (
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
    );
  }

  if (step.type === "style") {
    return (
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
    );
  }

  if (step.type === "slope") {
    return (
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
    );
  }

  if (step.type === "contact") {
    return (
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
    );
  }

  if (step.type === "deposit") {
    return (
      <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        <input
          type="checkbox"
          checked={data.deposit_informed}
          onChange={(e) => set("deposit_informed", e.target.checked)}
        />
        已向客户说明 $200 定金与价保 · Deposit &amp; price-match explained
      </label>
    );
  }

  return null;
}

export default function NewCustomerWizard() {
  const nav = useNavigate();
  const [data, setData] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const jump = (id) => {
    document.getElementById(`intake-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
        <p className="muted">同一页按序号边问边填，可滚动查看；英文话术可一键复制发给客户。</p>
      </div>

      <nav className="wizard-nav ts-glass" aria-label="Intake sections">
        {INTAKE_STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="wizard-nav-item"
            onClick={() => jump(s.id)}
          >
            <span className="wizard-nav-num">{s.num}</span>
            <span className="wizard-nav-title">{s.title_zh}</span>
          </button>
        ))}
      </nav>

      <div className="wizard-scroll">
        {INTAKE_STEPS.map((s) => (
          <section
            key={s.id}
            id={`intake-${s.id}`}
            className="wizard-step ts-glass"
          >
            <h3 className="wizard-step-title">
              <span className="wizard-step-num">{s.num}.</span>
              {s.title_zh}
              <span className="wizard-step-en"> · {s.title_en}</span>
            </h3>
            <Script zh={s.script_zh} en={s.script_en} />
            {s.script_en2 && <Script zh={s.script_zh2 || ""} en={s.script_en2} />}
            <StepFields step={s} data={data} set={set} />
          </section>
        ))}
      </div>

      <div className="wizard-save ts-glass">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || !data.name || !data.phone}
          onClick={save}
        >
          {busy ? "保存中…" : "保存客户 · Save to board"}
        </button>
        {(!data.name || !data.phone) && (
          <span className="muted">请先填写第 8 步姓名与电话</span>
        )}
        {err && <p className="err" style={{ margin: 0 }}>{err}</p>}
      </div>
    </div>
  );
}
