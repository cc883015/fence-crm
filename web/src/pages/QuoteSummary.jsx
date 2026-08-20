import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { fuzzyMatch } from "../lib/fuzzy.js";

const COLOR_PRESETS = [
  { id: "Black", zh: "黑色 Black" },
  { id: "Grey", zh: "灰色 Grey" },
  { id: "custom", zh: "定制颜色 Custom" },
];

const FENCE_STYLES = [
  { id: "vertical_blade", zh: "刀片垂直围栏", en: "Vertical Blade" },
  { id: "vertical_batten", zh: "高低不平垂直", en: "Vertical Batten" },
  { id: "horizontal", zh: "水平围栏", en: "Horizontal" },
];

const DRIVEWAY_WALL = [
  { id: "", zh: "请选择…" },
  { id: "with_wall", zh: "有砖墙（可依靠）" },
  { id: "no_wall", zh: "无砖墙" },
];

const NEAR_METER = [
  { id: "", zh: "请选择…" },
  { id: "no", zh: "否" },
  { id: "yes", zh: "是" },
];

const BRICK_NEED = [
  { id: "", zh: "请选择…" },
  { id: "existing", zh: "基于现有砖墙" },
  { id: "new", zh: "新砖墙" },
  { id: "none", zh: "无砖墙" },
];

const MOTORS = [
  { id: "standard", zh: "普通电机（650 刀）" },
  { id: "high", zh: "大功率电机（问电机公司报价）" },
  { id: "low_voltage", zh: "低压电机（基于 650 额外 $120）" },
  { id: "solar", zh: "太阳能电机（基于 650 额外 $650）" },
];

const SIDE_GATES = [
  { id: "", zh: "请选择… / 不需要" },
  { id: "vertical", zh: "垂直小门" },
  { id: "horizontal", zh: "水平小门" },
];

const GATE_CUSTOM = [
  { id: "", zh: "请选择…" },
  { id: "no", zh: "否（标准门）" },
  { id: "yes", zh: "是（定制门）" },
];

const emptyForm = {
  leadId: "",
  appointmentId: "",
  name: "",
  phone: "",
  address: "",
  fenceStyle: "",
  fenceColor: "Black",
  fenceColorCustom: "",
  drivewayWall: "",
  nearMeter: "",
  brickNeed: "",
  gateCustom: "",
  motor: "standard",
  gateColor: "Black",
  gateColorCustom: "",
  sideGate: "",
  sideGateColor: "Black",
  sideGateColorCustom: "",
  notes: "",
};

const STATUS_ZH = {
  new: "新咨询",
  quoted: "已发报价",
  deposit_paid: "已付定金",
  done: "已完工",
};

function Warn({ children }) {
  if (!children) return null;
  return <p className="quote-warn-blink" role="alert">{children}</p>;
}

function colorLabel(preset, custom) {
  if (preset === "custom") {
    return custom.trim() ? `定制颜色：${custom.trim()}` : "定制颜色（未填写）";
  }
  return preset || "—";
}

function ColorPicker({ label, preset, custom, onPreset, onCustom }) {
  const isCustom = preset === "custom";
  return (
    <div className="field">
      <label>{label}</label>
      <div className="quote-color-row">
        <select value={preset} onChange={(e) => onPreset(e.target.value)}>
          {COLOR_PRESETS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.zh}
            </option>
          ))}
        </select>
        {isCustom ? (
          <input
            value={custom}
            onChange={(e) => onCustom(e.target.value)}
            placeholder="输入定制颜色名…"
            aria-label={`${label}定制颜色`}
          />
        ) : null}
      </div>
      {isCustom ? <Warn>定制颜色额外收费 $40 / 米</Warn> : null}
    </div>
  );
}

export default function QuoteSummary() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [leadQ, setLeadQ] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [savedId, setSavedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(true);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([api.inbox(), api.appointments()])
      .then(([inboxRows, apptRows]) => {
        setLeads(inboxRows || []);
        setAppointments(apptRows || []);
      })
      .catch((e) => setErr(String(e.message || e)));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      setLoadingDoc(true);
      setErr("");
      try {
        const id = searchParams.get("id");
        const leadId = searchParams.get("leadId");
        const appointmentId = searchParams.get("appointmentId");

        if (id) {
          const doc = await api.quoteSummary(id);
          if (cancelled) return;
          applySavedDoc(doc);
          setSavedId(String(doc.id));
          return;
        }

        if (leadId) {
          const existing = await api.quoteSummaries({ lead_id: leadId });
          if (cancelled) return;
          if (existing?.[0]) {
            applySavedDoc(existing[0]);
            setSavedId(String(existing[0].id));
            navigate(`/admin/quote-summary?id=${existing[0].id}`, { replace: true });
            return;
          }
          const lead = (await api.inbox()).find((l) => String(l.id) === String(leadId));
          if (cancelled) return;
          setSavedId("");
          setForm({
            ...emptyForm,
            leadId: String(leadId),
            name: lead?.name || "",
            phone: lead?.phone || "",
            address: lead?.address || "",
          });
          return;
        }

        if (appointmentId) {
          const existing = await api.quoteSummaries({ appointment_id: appointmentId });
          if (cancelled) return;
          if (existing?.[0]) {
            applySavedDoc(existing[0]);
            setSavedId(String(existing[0].id));
            navigate(`/admin/quote-summary?id=${existing[0].id}`, { replace: true });
            return;
          }
          const appt = (await api.appointments()).find((a) => String(a.id) === String(appointmentId));
          if (cancelled) return;
          setSavedId("");
          setForm({
            ...emptyForm,
            appointmentId: String(appointmentId),
            name: appt?.name || "",
            phone: appt?.phone || "",
            address: appt?.address || "",
          });
          return;
        }

        setSavedId("");
        setForm(emptyForm);
      } catch (e) {
        if (!cancelled) setErr(String(e.message || e));
      } finally {
        if (!cancelled) setLoadingDoc(false);
      }
    };
    boot();
    return () => { cancelled = true; };
  }, [searchParams, navigate]);

  const applySavedDoc = (doc) => {
    const payload = doc.payload && typeof doc.payload === "object" ? doc.payload : {};
    setForm({
      ...emptyForm,
      ...payload,
      leadId: doc.lead_id ? String(doc.lead_id) : payload.leadId || "",
      appointmentId: doc.appointment_id ? String(doc.appointment_id) : payload.appointmentId || "",
      name: doc.name || payload.name || "",
      phone: doc.phone || payload.phone || "",
      address: doc.address || payload.address || "",
    });
  };

  const filteredLeads = useMemo(() => {
    const q = leadQ.trim();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        fuzzyMatch(l.name, q) ||
        fuzzyMatch(l.phone, q) ||
        fuzzyMatch(l.email, q) ||
        fuzzyMatch(l.address, q) ||
        fuzzyMatch(STATUS_ZH[l.status] || l.status, q)
    );
  }, [leads, leadQ]);

  const pickLead = (id) => {
    const lead = leads.find((l) => String(l.id) === String(id));
    if (!lead) {
      setForm((f) => ({ ...f, leadId: "", name: "" }));
      return;
    }
    setForm((f) => ({
      ...f,
      leadId: String(lead.id),
      name: lead.name || "",
      phone: lead.phone || "",
      address: lead.address || "",
    }));
  };

  const warnNoWall = form.drivewayWall === "no_wall";
  const warnMeter = form.nearMeter === "yes";
  const warnBrick =
    form.brickNeed === "existing" || form.brickNeed === "new";
  const warnNoBrickInground = form.brickNeed === "none";
  const warnCustomColor =
    form.fenceColor === "custom" ||
    form.gateColor === "custom" ||
    (form.sideGate && form.sideGateColor === "custom");

  const fenceLabel = FENCE_STYLES.find((s) => s.id === form.fenceStyle);
  const motorLabel = MOTORS.find((m) => m.id === form.motor);
  const sideLabel = SIDE_GATES.find((s) => s.id === form.sideGate);

  const summaryLines = useMemo(() => {
    const lines = [
      "NOVA FENCE · 客户报价单概要",
      "————————————",
      `姓名：${form.name || "—"}`,
      form.phone ? `电话：${form.phone}` : null,
      form.address ? `地址：${form.address}` : null,
      `栅栏样式：${fenceLabel ? `${fenceLabel.zh} / ${fenceLabel.en}` : "—"}`,
      `栅栏颜色：${colorLabel(form.fenceColor, form.fenceColorCustom)}`,
      `Driveway 滑动门砖墙：${
        form.drivewayWall === "with_wall"
          ? "有砖墙（可依靠）"
          : form.drivewayWall === "no_wall"
            ? "无砖墙"
            : "—"
      }`,
      `安装靠近电表电箱：${
        form.nearMeter === "yes" ? "是" : form.nearMeter === "no" ? "否" : "—"
      }`,
      `砖墙需求：${
        form.brickNeed === "existing"
          ? "基于现有砖墙"
          : form.brickNeed === "new"
            ? "新砖墙"
            : form.brickNeed === "none"
              ? "无砖墙"
              : "—"
      }`,
      `大门是否定制：${
        form.gateCustom === "yes" ? "是" : form.gateCustom === "no" ? "否" : "—"
      }`,
      `大门颜色：${colorLabel(form.gateColor, form.gateColorCustom)}`,
      `电机：${motorLabel?.zh || "—"}`,
      `小门：${sideLabel && sideLabel.id ? sideLabel.zh : "—"}`,
      form.sideGate
        ? `小门颜色：${colorLabel(form.sideGateColor, form.sideGateColorCustom)}`
        : null,
    ].filter(Boolean);

    const warns = [];
    if (warnNoWall) warns.push("⚠ 无砖墙：增加两根 100mm 柱子");
    if (warnMeter) warns.push("⚠ 靠近电表电箱：多增加柱子，确保不要破坏藏有电线的墙壁");
    if (warnBrick) {
      warns.push(
        "⚠ 砖墙方案：垂直请使用标准 1.2 米刀片围栏；水平可根据客户需求定制"
      );
    }
    if (warnNoBrickInground) {
      warns.push("⚠ 无砖墙：使用直接入地的柱子（Inground Post）");
    }
    if (warnCustomColor) {
      warns.push("⚠ 定制颜色：额外收费 $40 / 米");
    }

    if (warns.length) {
      lines.push("————————————", "结论 / 警示：", ...warns);
    }
    if (form.notes.trim()) {
      lines.push("————————————", `备注：${form.notes.trim()}`);
    }
    return lines.join("\n");
  }, [
    form,
    fenceLabel,
    motorLabel,
    sideLabel,
    warnNoWall,
    warnMeter,
    warnBrick,
    warnNoBrickInground,
    warnCustomColor,
  ]);

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryLines);
      setOk("已复制报价概要，可粘贴到微信 / 报价单");
      setErr("");
    } catch {
      setErr("复制失败，请手动选择下方文字");
      setOk("");
    }
  };

  const saveSummary = async () => {
    if (!form.name.trim()) {
      setErr("请先填写姓名");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const body = {
        lead_id: form.leadId || null,
        appointment_id: form.appointmentId || null,
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        payload: form,
        summary_text: summaryLines,
      };
      const row = savedId
        ? await api.updateQuoteSummary(savedId, body)
        : await api.createQuoteSummary(body);
      setSavedId(String(row.id));
      setOk(savedId ? "报价概要已更新" : "报价概要已保存，可从来客跟进 / 测量打开");
      navigate(`/admin/quote-summary?id=${row.id}`, { replace: true });
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setForm(emptyForm);
    setSavedId("");
    setLeadQ("");
    setOk("");
    setErr("");
    navigate("/admin/quote-summary", { replace: true });
  };

  const selectedStillVisible =
    !form.leadId ||
    filteredLeads.some((l) => String(l.id) === String(form.leadId));

  return (
    <div className="orders-main quote-summary-page">
      <div className="orders-head">
        <div>
          <p className="ts-eyebrow">Mobile quote sheet · 报价概要</p>
          <h2 style={{ margin: "0.2rem 0 0" }}>客户报价单概要</h2>
          <p className="muted">
            写完直接保存到系统，并绑定来客跟进 / 测量预约。来客卡片与测量列表可一键打开。
            {savedId ? ` · 已保存 #${savedId}` : ""}
          </p>
        </div>
      </div>

      {loadingDoc && <p className="muted">加载中…</p>}
      {err && <p className="err">{err}</p>}
      {ok && <p className="ok">{ok}</p>}

      <form
        className="ts-glass quote-summary-form"
        onSubmit={(e) => {
          e.preventDefault();
          saveSummary();
        }}
      >
        <div className="field">
          <label>关联来客跟进（全部状态）</label>
          <div className="quote-lead-row">
            <select
              value={selectedStillVisible ? form.leadId : ""}
              onChange={(e) => pickLead(e.target.value)}
            >
              <option value="">不关联 / 手动填姓名</option>
              {filteredLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                  {l.phone ? ` · ${l.phone}` : ""}
                  {` · ${STATUS_ZH[l.status] || l.status}`}
                </option>
              ))}
            </select>
            <input
              type="search"
              value={leadQ}
              onChange={(e) => setLeadQ(e.target.value)}
              placeholder="检索关键词…"
              aria-label="检索来客"
            />
          </div>
          <p className="muted" style={{ fontSize: "0.82rem", margin: "0.25rem 0 0" }}>
            显示 {filteredLeads.length}/{leads.length} 条
            {leadQ.trim() ? ` · 关键词「${leadQ.trim()}」` : ""}
          </p>
          {form.leadId && (
            <Link
              className="maps-link"
              to={`/admin/inbox?status=${
                leads.find((l) => String(l.id) === form.leadId)?.status || "new"
              }`}
            >
              打开来客跟进 ↗
            </Link>
          )}
        </div>

        <div className="field">
          <label>绑定测量预约（可选）</label>
          <select
            value={form.appointmentId}
            onChange={(e) => {
              const id = e.target.value;
              const appt = appointments.find((a) => String(a.id) === String(id));
              setForm((f) => ({
                ...f,
                appointmentId: id,
                name: f.name || appt?.name || "",
                phone: f.phone || appt?.phone || "",
                address: f.address || appt?.address || "",
              }));
            }}
          >
            <option value="">不绑定测量预约</option>
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.appointment_date} {a.appointment_time || ""} · {a.name}
                {a.address ? ` · ${a.address}` : ""}
              </option>
            ))}
          </select>
          {form.appointmentId && (
            <Link className="maps-link" to="/admin/appointments">
              打开测量系统 ↗
            </Link>
          )}
        </div>

        <div className="field">
          <label>姓名 *</label>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="客户姓名"
            list="quote-lead-names"
          />
          <datalist id="quote-lead-names">
            {leads.map((l) => (
              <option key={l.id} value={l.name} />
            ))}
          </datalist>
        </div>

        <div className="quote-field-grid">
          <div className="field">
            <label>电话</label>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="04…"
            />
          </div>
          <div className="field">
            <label>地址</label>
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Suburb / street"
            />
          </div>
        </div>

        <hr className="quote-divider" />
        <p className="quote-section-title">1 · 栅栏</p>

        <div className="field">
          <label>栅栏样式</label>
          <select
            value={form.fenceStyle}
            onChange={(e) => set("fenceStyle", e.target.value)}
          >
            <option value="">请选择…</option>
            {FENCE_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.zh} / {s.en}
              </option>
            ))}
          </select>
        </div>

        <ColorPicker
          label="栅栏颜色"
          preset={form.fenceColor}
          custom={form.fenceColorCustom}
          onPreset={(v) => set("fenceColor", v)}
          onCustom={(v) => set("fenceColorCustom", v)}
        />

        <hr className="quote-divider" />
        <p className="quote-section-title">2 · Driveway / 滑动门</p>

        <div className="field">
          <label>滑动门砖墙 — 有无可以依靠</label>
          <select
            value={form.drivewayWall}
            onChange={(e) => set("drivewayWall", e.target.value)}
          >
            {DRIVEWAY_WALL.map((o) => (
              <option key={o.id || "empty"} value={o.id}>
                {o.zh}
              </option>
            ))}
          </select>
          {warnNoWall && <Warn>增加两根 100mm 柱子</Warn>}
        </div>

        <div className="field">
          <label>大门是否定制</label>
          <select
            value={form.gateCustom}
            onChange={(e) => set("gateCustom", e.target.value)}
          >
            {GATE_CUSTOM.map((o) => (
              <option key={o.id || "empty"} value={o.id}>
                {o.zh}
              </option>
            ))}
          </select>
        </div>

        <ColorPicker
          label="大门颜色"
          preset={form.gateColor}
          custom={form.gateColorCustom}
          onPreset={(v) => set("gateColor", v)}
          onCustom={(v) => set("gateColorCustom", v)}
        />

        <div className="field">
          <label>电机</label>
          <select
            value={form.motor}
            onChange={(e) => set("motor", e.target.value)}
          >
            {MOTORS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.zh}
              </option>
            ))}
          </select>
          {form.gateCustom === "yes" && (
            <span className="muted" style={{ fontSize: "0.82rem" }}>
              定制门可选手动选电机（含大功率）
            </span>
          )}
        </div>

        <hr className="quote-divider" />
        <p className="quote-section-title">3 · 小门</p>

        <div className="field">
          <label>小门</label>
          <select
            value={form.sideGate}
            onChange={(e) => set("sideGate", e.target.value)}
          >
            {SIDE_GATES.map((o) => (
              <option key={o.id || "empty"} value={o.id}>
                {o.zh}
              </option>
            ))}
          </select>
        </div>

        {form.sideGate ? (
          <ColorPicker
            label="小门颜色"
            preset={form.sideGateColor}
            custom={form.sideGateColorCustom}
            onPreset={(v) => set("sideGateColor", v)}
            onCustom={(v) => set("sideGateColorCustom", v)}
          />
        ) : null}

        <hr className="quote-divider" />
        <p className="quote-section-title">4 · 现场条件</p>

        <div className="field">
          <label>安装是否靠近电表电箱</label>
          <select
            value={form.nearMeter}
            onChange={(e) => set("nearMeter", e.target.value)}
          >
            {NEAR_METER.map((o) => (
              <option key={o.id || "empty"} value={o.id}>
                {o.zh}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>是否需要砖墙</label>
          <select
            value={form.brickNeed}
            onChange={(e) => set("brickNeed", e.target.value)}
          >
            {BRICK_NEED.map((o) => (
              <option key={o.id || "empty"} value={o.id}>
                {o.zh}
              </option>
            ))}
          </select>
          {warnNoBrickInground && (
            <Warn>使用直接入地的柱子（Inground Post）</Warn>
          )}
        </div>

        <div className="field">
          <label>备注</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="坡度 / 特殊要求…"
          />
        </div>

        <section className="quote-conclusion ts-glass-soft">
          <h3>结论 / 警示</h3>
          {!warnNoWall &&
            !warnMeter &&
            !warnBrick &&
            !warnNoBrickInground &&
            !warnCustomColor && (
            <p className="muted">当前选项暂无额外警示。</p>
          )}
          {warnNoWall && <Warn>无砖墙：增加两根 100mm 柱子</Warn>}
          {warnMeter && (
            <Warn>
              靠近电表电箱：多增加柱子，确保不要破坏藏有电线的墙壁
            </Warn>
          )}
          {warnBrick && (
            <Warn>
              请注意：垂直请使用标准 1.2 米刀片围栏；水平可以根据客户需求定制
            </Warn>
          )}
          {warnNoBrickInground && (
            <Warn>无砖墙：使用直接入地的柱子（Inground Post）</Warn>
          )}
          {warnCustomColor && <Warn>定制颜色：额外收费 $40 / 米</Warn>}
        </section>

        <div className="toolbar quote-summary-actions">
          <button type="submit" className="btn btn-primary" disabled={busy || loadingDoc}>
            {busy ? "保存中…" : savedId ? "保存更新" : "保存报价概要"}
          </button>
          <button type="button" className="btn btn-ghost ts-glass" onClick={copySummary}>
            复制文案
          </button>
          <button type="button" className="btn btn-ghost ts-glass" onClick={reset}>
            新建空白
          </button>
        </div>
      </form>

      <pre className="quote-summary-preview ts-glass">{summaryLines}</pre>
    </div>
  );
}
