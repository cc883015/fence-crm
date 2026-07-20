import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { CATALOGUE, CONTACT } from "../data/products.js";
import { api } from "../lib/api.js";

const SLIDES = [
  "/products/horizontal.jpg",
  "/products/brick.jpg",
  "/products/gate.jpg",
  "/products/flyer-35mm.png",
];

export default function Home() {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({
    name: "", phone: "", email: "", suburb: "",
    fence_length: "", fence_type: "blade", color: "Black",
    automatic_gate: false, message: "",
  });
  const [status, setStatus] = useState("");
  const [videoOk, setVideoOk] = useState(true);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await api.submitLead({ ...form, source: "website", gate_required: form.automatic_gate });
      setStatus("ok");
      setForm({
        name: "", phone: "", email: "", suburb: "",
        fence_length: "", fence_type: "blade", color: "Black",
        automatic_gate: false, message: "",
      });
    } catch (err) {
      setStatus(String(err.message || err));
    }
  };

  return (
    <>
      <header className="site-header ts-glass">
        <Link to="/" className="brand">
          <span className="brand-mark">N</span>
          <span>NOVA FENCE</span>
        </Link>
        <div className="header-actions">
          <a className="btn btn-ghost btn-sm" href="#products">Products · 产品</a>
          <a className="btn btn-ghost btn-sm" href="#quote">Quote · 报价</a>
          {isAdmin ? (
            <Link className="btn btn-primary btn-sm" to="/admin">Admin · 后台</Link>
          ) : (
            <Link className="btn btn-primary btn-sm ts-glass" to="/login">Log in</Link>
          )}
        </div>
      </header>

      <section className="hero">
        {videoOk ? (
          <video
            className="hero-media"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/hero-poster.jpg"
            onError={() => setVideoOk(false)}
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
        ) : (
          <div className="hero-slides" aria-hidden>
            {SLIDES.map((src) => (
              <div key={src} className="hero-slide" style={{ backgroundImage: `url(${src})` }} />
            ))}
          </div>
        )}
        <div className="hero-veil" />
        <div className="hero-card ts-glass">
          <p className="ts-eyebrow">
            <span className="live-dot" />
            Design · Quality · Privacy
          </p>
          <h1>NOVA FENCE</h1>
          <p>
            One-stop fence solutions across Brisbane, Logan, Ipswich &amp; the Gold Coast.
            <br />
            布里斯班周边一站式围栏：设计 · 审批 · 施工 · 安装。
          </p>
          <div className="hero-ctas">
            <a className="btn btn-primary" href="#quote">Free Measure &amp; Quote</a>
            <a className="btn btn-ghost ts-glass" href="#products">View Products · 查看产品</a>
          </div>
        </div>
      </section>

      <section className="section" id="products">
        <div className="section-head">
          <p className="ts-eyebrow">Stock · Specs</p>
          <hr className="ts-rule" />
          <h2>Our Products · 产品系列</h2>
          <p>2 colours · Multiple styles · Ready stock available · 中英文规格一目了然</p>
        </div>
        <div className="product-grid">
          {CATALOGUE.map((p) => (
            <article key={p.slug} className="ts-card product-card">
              <img src={p.image} alt={p.name_en} loading="lazy" />
              <div className="product-body">
                <p className="ts-eyebrow">{p.slug}</p>
                <h3>{p.name_en}</h3>
                <p className="zh">{p.name_zh}</p>
                <p className="muted">{p.blurb_en}</p>
                <p className="muted">{p.blurb_zh}</p>
                <div className="specs">
                  <span className="chip gold">Gap {p.gap}</span>
                  <span className="chip">{p.thickness}</span>
                  <span className="chip">Panel {p.panel}</span>
                  {p.colors.map((c) => (
                    <span className="chip" key={c}>{c}</span>
                  ))}
                </div>
                <div className="specs">
                  {p.features.map((f) => (
                    <span className="chip" key={f}>{f}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="services">
        <div className="ts-glass quote-panel">
          <p className="ts-eyebrow">One-stop</p>
          <h2 style={{ margin: "0.4rem 0" }}>Services · 服务</h2>
          <div className="specs" style={{ marginTop: "1rem" }}>
            {[
              "Free Measure & Quote",
              "Custom Fence Design",
              "Council Approval Assistance",
              "Brick Wall Construction",
              "Aluminium Fencing & Gates",
              "Gate Motors & Electrical",
              "Professional Installation",
            ].map((s) => (
              <span className="chip gold" key={s}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="quote">
        <div className="section-head">
          <p className="ts-eyebrow">Online enquiry</p>
          <hr className="ts-rule" />
          <h2>Get a Rough Quote · 在线初步报价</h2>
          <p>提交后自动进入 CRM（手机/邮箱去重）。电话客户请用管理员「新客户」引导流程。</p>
        </div>
        <form className="ts-glass quote-panel" onSubmit={submit}>
          <div className="form-grid">
            <div className="field">
              <label>Name · 姓名 *</label>
              <input required value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="field">
              <label>Phone · 电话 *</label>
              <input required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="field">
              <label>Email · 邮箱</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="field">
              <label>Suburb · 区</label>
              <input value={form.suburb} onChange={(e) => set("suburb", e.target.value)} placeholder="e.g. Rochedale" />
            </div>
            <div className="field">
              <label>Approx. length · 大概长度</label>
              <input value={form.fence_length} onChange={(e) => set("fence_length", e.target.value)} placeholder="e.g. 25m" />
            </div>
            <div className="field">
              <label>Style · 款式</label>
              <select value={form.fence_type} onChange={(e) => set("fence_type", e.target.value)}>
                {CATALOGUE.filter((p) => !["pedestrian-gate", "brick-pillar"].includes(p.slug)).map((p) => (
                  <option key={p.slug} value={p.slug}>{p.name_en} / {p.name_zh}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Colour · 颜色</label>
              <select value={form.color} onChange={(e) => set("color", e.target.value)}>
                <option>Black</option>
                <option>Grey</option>
              </select>
            </div>
            <div className="field">
              <label>Automatic gate · 电动门</label>
              <select
                value={form.automatic_gate ? "yes" : "no"}
                onChange={(e) => set("automatic_gate", e.target.value === "yes")}
              >
                <option value="no">No · 不需要</option>
                <option value="yes">Yes · 需要</option>
              </select>
            </div>
          </div>
          <div className="field" style={{ marginTop: "0.85rem" }}>
            <label>Message · 留言</label>
            <textarea value={form.message} onChange={(e) => set("message", e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Submitting…" : "Submit enquiry · 提交"}
            </button>
            {status === "ok" && <span className="ok">Thanks! We&apos;ll be in touch. · 已提交</span>}
            {status && status !== "ok" && status !== "sending" && <span className="err">{status}</span>}
          </div>
        </form>
      </section>

      <footer className="site-footer ts-glass-soft">
        <strong>{CONTACT.showroom}</strong>
        <span>{CONTACT.address}</span>
        <span>Tel {CONTACT.phone} · Mobile {CONTACT.mobile}</span>
        <span>{CONTACT.email} · {CONTACT.web}</span>
        <span className="muted">中文 / ENGLISH · Serving {CONTACT.areas.join(", ")}</span>
      </footer>
    </>
  );
}
