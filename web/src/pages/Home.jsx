import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLang, t } from "../context/LangContext.jsx";
import { CATALOGUE, CONTACT } from "../data/products.js";
import { api } from "../lib/api.js";

const HERO_PERKS = [
  {
    en: "More privacy,",
    enSub: "without closing you in",
    zh: "隐私更好，",
    zhSub: "却不压抑封闭",
  },
  {
    en: "Powder-coated aluminium",
    enSub: "that stays sharp outdoors",
    zh: "粉末喷涂铝合金",
    zhSub: "户外经久如新",
  },
  {
    en: "Ready stock · faster install",
    enSub: "Brisbane to the Gold Coast",
    zh: "现货 · 安装更快",
    zhSub: "布里斯班到黄金海岸",
  },
];

const BENEFITS = [
  {
    img: "/products/decorative.jpg",
    title_en: "35mm Gap — More Privacy",
    title_zh: "35mm 间隙 — 更私密",
    desc_en: "Tighter battens for stylish privacy without a closed-in feel.",
    desc_zh: "间隙更紧凑，兼顾隐私与现代外观。",
    tag: "35mm GAP",
  },
  {
    img: "/products/vertical.jpg",
    title_en: "Built for Privacy",
    title_zh: "为隐私而生",
    desc_en: "More privacy · Modern appearance · Premium aluminium quality.",
    desc_zh: "更好隐私 · 现代外观 · 优质铝合金。",
    tag: "PRIVACY",
  },
  {
    img: "/products/horizontal.jpg",
    title_en: "Modern Look. Great Value.",
    title_zh: "现代外观，超值选择",
    desc_en: "1.2mm full-panel thickness · 15mm narrow gaps · lasting finish.",
    desc_zh: "整板 1.2mm · 15mm 窄间隙 · 持久涂层。",
    tag: "VALUE",
  },
  {
    img: "/products/brick.jpg",
    title_en: "Curb Appeal that Sells",
    title_zh: "提升门面与房产价值",
    desc_en: "Brick pillars + fencing to ground — stylish and cost effective.",
    desc_zh: "砖柱 + 落地围栏 — 美观且性价比高。",
    tag: "VALUE+",
  },
];

const COLORS = [
  { id: "Black", swatch: "#1a1a1a", name_en: "Black / Charcoal", name_zh: "黑色 / 深灰" },
  { id: "Grey", swatch: "#8a8f96", name_en: "Grey / Silver", name_zh: "灰色 / 银色" },
];

export default function Home() {
  const { isAdmin } = useAuth();
  const { lang, setLang } = useLang();
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

  const fenceStyles = CATALOGUE.filter((p) => !["pedestrian-gate", "brick-pillar"].includes(p.slug));

  return (
    <>
      <header className="site-header ts-glass">
        <Link to="/" className="brand" aria-label="NOVA FENCE">
          <img
            className="brand-logo"
            src="/nova-fence-logo.png"
            alt="NOVA FENCE"
            width="220"
            height="48"
          />
        </Link>
        <div className="header-actions">
          <a className="btn btn-ghost btn-sm" href="#products">{t(lang, "Products", "产品")}</a>
          <a className="btn btn-ghost btn-sm" href="#quote">{t(lang, "Quote", "报价")}</a>
          <div className="lang-switch" role="group" aria-label="Language">
            <button type="button" className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
            <button type="button" className={lang === "zh" ? "on" : ""} onClick={() => setLang("zh")}>中文</button>
          </div>
          {isAdmin ? (
            <Link className="btn btn-primary btn-sm" to="/admin">{t(lang, "Admin", "后台")}</Link>
          ) : (
            <Link className="btn btn-primary btn-sm" to="/login">{t(lang, "Log in", "登录")}</Link>
          )}
        </div>
      </header>

      {/* Hero video + quote form */}
      <section className="hero hero-with-quote" id="quote">
        {videoOk ? (
          <video
            className="hero-media"
            autoPlay muted loop playsInline
            preload="metadata"
            poster="/hero-poster.jpg"
            onError={() => setVideoOk(false)}
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
        ) : (
          <div className="hero-slides" aria-hidden>
            {["/products/horizontal.jpg", "/products/blade.jpg", "/products/brick.jpg", "/products/gate.jpg"].map((src) => (
              <div key={src} className="hero-slide" style={{ backgroundImage: `url(${src})` }} />
            ))}
          </div>
        )}
        <div className="hero-veil" />

        <div className="hero-split">
          <div className="hero-card ts-glass">
            <p className="hero-eyebrow">
              <span className="live-dot" />
              Brisbane · Design · Quality · Privacy
            </p>
            <h1>NOVA FENCE</h1>
            <p className="hero-lead">
              {lang === "zh" ? (
                <>
                  优质铝合金围栏 — 2 种颜色、多款式现货，服务{" "}
                  <strong className="area-gold">Brisbane, Logan, Ipswich &amp; the Gold Coast</strong>。
                </>
              ) : (
                <>
                  Premium aluminium fencing — 2 colours, multiple styles, ready stock across{" "}
                  <strong className="area-gold">Brisbane, Logan, Ipswich &amp; the Gold Coast</strong>.
                </>
              )}
            </p>
            <div className="hero-quick">
              <span className="chip gold">2 Colours</span>
              <span className="chip gold">6 Product lines</span>
              <span className="chip gold">Gaps 15–40mm</span>
              <span className="chip gold">Panels ~2.4m</span>
            </div>
            <a className="btn btn-ghost hero-ghost" href="#products" style={{ marginTop: "1rem" }}>
              {t(lang, "Browse products ↓", "浏览产品 ↓")}
            </a>

            <ul className="hero-perks" aria-label={t(lang, "Why choose NOVA", "选择 NOVA 的好处")}>
              {HERO_PERKS.map((p, i) => (
                <li key={p.en} className="hero-perk" style={{ "--i": i }}>
                  <span className="hero-perk-mark" aria-hidden>/</span>
                  <div>
                    <p className="hero-perk-line">
                      {lang === "zh" ? p.zh : p.en}
                    </p>
                    <p className="hero-perk-sub">
                      {lang === "zh" ? p.zhSub : p.enSub}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <form className="hero-quote ts-glass" onSubmit={submit}>
            <p className="hero-eyebrow">{t(lang, "Free rough quote", "免费初步报价")}</p>
            <h2 className="hero-quote-title">{t(lang, "Get a quote now", "立即获取报价")}</h2>
            <div className="hero-quote-grid">
              <div className="field">
                <label>{t(lang, "Name *", "姓名 *")}</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="field">
                <label>{t(lang, "Phone *", "电话 *")}</label>
                <input required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div className="field">
                <label>{t(lang, "Email", "邮箱")}</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@email.com" />
              </div>
              <div className="field">
                <label>{t(lang, "Area / Suburb *", "服务区 *")}</label>
                <select required value={form.suburb} onChange={(e) => set("suburb", e.target.value)}>
                  <option value="">{t(lang, "Select area…", "选择区域…")}</option>
                  {CONTACT.areas.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t(lang, "Length", "长度")}</label>
                <input value={form.fence_length} onChange={(e) => set("fence_length", e.target.value)} placeholder="25m" />
              </div>
              <div className="field">
                <label>{t(lang, "Style", "款式")}</label>
                <select value={form.fence_type} onChange={(e) => set("fence_type", e.target.value)}>
                  {fenceStyles.map((p) => (
                    <option key={p.slug} value={p.slug}>{t(lang, p.name_en, p.name_zh)}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t(lang, "Colour", "颜色")}</label>
                <select value={form.color} onChange={(e) => set("color", e.target.value)}>
                  <option>Black</option>
                  <option>Grey</option>
                </select>
              </div>
            </div>
            <div className="field" style={{ marginTop: "0.65rem" }}>
              <label>{t(lang, "Message", "留言")}</label>
              <textarea rows={2} value={form.message} onChange={(e) => set("message", e.target.value)} />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
                {status === "sending" ? t(lang, "Submitting…", "提交中…") : t(lang, "Submit enquiry", "提交咨询")}
              </button>
              {status === "ok" && <span className="ok">{t(lang, "Thanks! We'll be in touch.", "已提交！")}</span>}
              {status && status !== "ok" && status !== "sending" && <span className="err">{status}</span>}
            </div>
          </form>
        </div>
      </section>

      {/* Products first — styles, colours, sizes */}
      <section className="section" id="products">
        <div className="section-head">
          <p className="ts-eyebrow">{t(lang, "In stock now", "现货产品")}</p>
          <hr className="ts-rule" />
          <h2>{t(lang, "Styles · Colours · Sizes", "款式 · 颜色 · 尺寸")}</h2>
          <p>
            {t(
              lang,
              "Each photo matches the product — see gap, thickness and panel size at a glance.",
              "每张图对应真实款式 — 间隙、厚度、板长一目了然。"
            )}
          </p>
        </div>

        <div className="colour-row">
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`colour-chip ${form.color === c.id ? "on" : ""}`}
              onClick={() => set("color", c.id)}
            >
              <i style={{ background: c.swatch }} />
              <span>{t(lang, c.name_en, c.name_zh)}</span>
            </button>
          ))}
          <span className="muted colour-note">
            {t(lang, "Powder coated · Queensland weather ready", "粉末喷涂 · 适应昆士兰气候")}
          </span>
        </div>

        <div className="product-grid">
          {CATALOGUE.map((p) => (
            <article key={p.slug} className="ts-card product-card">
              <div className="product-img-wrap">
                <img src={p.image} alt={p.name_en} loading="lazy" />
                <div className="product-img-glass">
                  <span className="chip gold">Gap {p.gap}</span>
                  <span className="chip">{p.thickness}</span>
                  <span className="chip">{p.panel}</span>
                </div>
              </div>
              <div className="product-body">
                <h3>{t(lang, p.name_en, p.name_zh)}</h3>
                {lang === "zh" && <p className="zh">{p.name_en}</p>}
                <p className="muted">{t(lang, p.blurb_en, p.blurb_zh)}</p>
                <div className="specs">
                  {p.colors.map((c) => (
                    <span className="chip chip-color" key={c} data-color={c}>{c}</span>
                  ))}
                  {p.features.map((f) => (
                    <span className="chip" key={f}>{f}</span>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  style={{ marginTop: "0.65rem" }}
                  onClick={() => {
                    if (["pedestrian-gate", "brick-pillar"].includes(p.slug)) {
                      document.getElementById("quote")?.scrollIntoView({ behavior: "smooth" });
                      return;
                    }
                    set("fence_type", p.slug);
                    document.getElementById("quote")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {t(lang, "Quote this style", "用此款报价")}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="why">
        <div className="section-head">
          <p className="ts-eyebrow">{t(lang, "Why NOVA", "为何选择")}</p>
          <hr className="ts-rule" />
          <h2>{t(lang, "Advantages you can see", "看得见的优势")}</h2>
        </div>
        <div className="benefit-grid">
          {BENEFITS.map((b) => (
            <article key={b.tag} className="benefit-card">
              <div className="benefit-bg" style={{ backgroundImage: `url(${b.img})` }} />
              <div className="benefit-glass ts-glass">
                <span className="benefit-tag">{b.tag}</span>
                <h3>{t(lang, b.title_en, b.title_zh)}</h3>
                <p>{t(lang, b.desc_en, b.desc_zh)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer ts-glass-soft">
        <strong>{CONTACT.showroom}</strong>
        <span>{CONTACT.address}</span>
        <span>Tel {CONTACT.phone} · Mobile {CONTACT.mobile}</span>
        <span>{CONTACT.email} · {CONTACT.web}</span>
        <span className="muted">
          {lang === "zh" ? "服务区域：" : "Serving "}
          <strong className="area-gold">Brisbane, Logan, Ipswich &amp; the Gold Coast</strong>
        </span>
      </footer>
    </>
  );
}
