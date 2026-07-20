import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function Website() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", suburb: "", fence_length: "", fence_type: "", gate_required: false, message: "", source: "website" });
  const [sent, setSent] = useState(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => { api.products().then(setProducts).catch(() => {}); }, []);

  const submit = async () => {
    if (!form.name || (!form.phone && !form.email)) { alert("请至少填写姓名 + 电话或邮箱"); return; }
    try {
      const r = await api.submitLead(form);
      setSent(r);
    } catch (e) { alert("提交失败：" + e); }
  };

  return (
    <div className="site">
      <section className="hero">
        <div className="hero-in">
          <p className="eyebrow">Premium Aluminium Fencing · Brisbane · Logan · Ipswich · Gold Coast</p>
          <h1>Secure. Stylish.<br/>Built to last.</h1>
          <p className="lede">Supply and installation of aluminium blade, slat and decorative fencing. Get a free quote in minutes.</p>
        </div>
      </section>

      <section className="products">
        <h2>Our Fences</h2>
        <div className="pgrid">
          {products.map((p) => (
            <div className="pcard" key={p.slug}>
              <div className="pcard-top" style={{ background: swatch(p.slug) }} />
              <div className="pcard-body">
                <h3>{p.name_en}</h3>
                <div className="pspecs">{p.thickness} · gaps {p.gap} · panel {p.panel}</div>
                <ul>{(p.features || []).map((f) => <li key={f}>✔ {f}</li>)}</ul>
                <div className="pprice">${p.price_min}–${p.price_max}/m</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="quote">
        <div className="quote-in">
          <h2>Get a Free Quote</h2>
          {sent ? (
            <div className="thanks">
              <strong>Thanks — we'll be in touch shortly.</strong>
              <p className="muted">
                {sent.intake_status === "duplicate"
                  ? "（后台：识别为已有客户，已更新资料，未重复建档）"
                  : "（后台：已创建新客户并进入 CRM 看板）"}
              </p>
              <button className="savebtn" onClick={() => setSent(null)}>再填一条</button>
            </div>
          ) : (
            <div className="qform">
              <input placeholder="Name*" value={form.name} onChange={(e)=>set("name",e.target.value)} />
              <input placeholder="Phone" value={form.phone} onChange={(e)=>set("phone",e.target.value)} />
              <input placeholder="Email" value={form.email} onChange={(e)=>set("email",e.target.value)} />
              <input placeholder="Suburb" value={form.suburb} onChange={(e)=>set("suburb",e.target.value)} />
              <input placeholder="Fence length (m)" value={form.fence_length} onChange={(e)=>set("fence_length",e.target.value)} />
              <select value={form.fence_type} onChange={(e)=>set("fence_type",e.target.value)}>
                <option value="">Fence type</option>
                {products.map((p)=><option key={p.slug} value={p.slug}>{p.name_en}</option>)}
              </select>
              <select value={form.source} onChange={(e)=>set("source",e.target.value)}>
                <option value="website">Source: Website</option>
                <option value="google_ads">Google Ads</option>
                <option value="facebook">Facebook</option>
                <option value="referral">Referral</option>
              </select>
              <label className="check"><input type="checkbox" checked={form.gate_required} onChange={(e)=>set("gate_required",e.target.checked)} /> Need a gate?</label>
              <textarea placeholder="Message" value={form.message} onChange={(e)=>set("message",e.target.value)} />
              <button className="savebtn wide" onClick={submit}>Submit</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function swatch(slug) {
  return { blade: "#3a4a5a", decorative: "#6b5b4a", horizontal: "#4a5a4a" }[slug] || "#555";
}
