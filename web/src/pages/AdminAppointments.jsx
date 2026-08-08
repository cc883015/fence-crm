import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api.js";
import { fuzzyMatch } from "../lib/fuzzy.js";

function apptSortKey(a) {
  const t = a.appointment_time || "99:99";
  return `${a.appointment_date || ""}T${t}`;
}

const empty = {
  name: "",
  phone: "",
  email: "",
  appointment_date: "",
  appointment_time: "",
  address: "",
  notes: "",
  status: "scheduled",
};

const WEEKDAY_ZH = { wed: "周三", sat: "周六" };
const WEEKDAY_EN = { wed: "Wednesday", sat: "Saturday" };

function weekdayOf(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const n = d.getDay();
  if (n === 3) return "wed";
  if (n === 6) return "sat";
  return "";
}

function nextWeekdayDate(targetDay) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  const delta = (targetDay - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function googleMapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "")}`;
}

/**
 * HTTPS bridge on our site (clickable in WeChat), then jumps into Apple Maps with the address.
 * Raw maps:// is not auto-linked in WeChat group chats.
 */
function appleMapsUrl(address) {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://fence-crm.n12047805.workers.dev";
  return `${origin}/go/apple-maps?q=${encodeURIComponent(address || "")}`;
}

/** Prefer API fields, fall back to address-built links. */
function mapLinks(a) {
  const addr = a?.address || "";
  return {
    google: a?.maps_url || googleMapsUrl(addr),
    apple: a?.apple_maps_url || appleMapsUrl(addr),
  };
}

function formatDateZh(dateStr) {
  if (!dateStr) return "—";
  const [y, m, day] = dateStr.split("-");
  return `${y}年${Number(m)}月${Number(day)}日`;
}

function shareText(a) {
  const wdKey = a.weekday || weekdayOf(a.appointment_date);
  const wdLabel = WEEKDAY_ZH[wdKey] || "";
  const maps = mapLinks(a);
  const lines = [
    "📐 NOVA FENCE · 上门测量",
    "————————————",
    `客户：${a.name || "—"}`,
    `电话：${a.phone || "—"}`,
    `时间：${formatDateZh(a.appointment_date)}${wdLabel ? `（${wdLabel}）` : ""}${a.appointment_time ? ` ${a.appointment_time}` : ""}`,
    `地址：${a.address || "—"}`,
    `Google 地图：${maps.google}`,
    `Apple 地图：${maps.apple}`,
  ];
  if (a.email) lines.push(`邮箱：${a.email}`);
  if (a.notes) lines.push(`备注：${a.notes}`);
  lines.push(`状态：${a.status === "completed" ? "测量完成 ✓" : "待测量"}`);
  lines.push("————————————", a.status === "completed" ? "测量已完成" : "请准时上门测量");
  return lines.join("\n");
}

function drawShareCard(canvas, a) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = 720;
  const H = a.email || a.notes ? 520 : 460;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // background
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#1a2744");
  g.addColorStop(1, "#243556");
  ctx.fillStyle = g;
  roundRect(ctx, 0, 0, W, H, 28);
  ctx.fill();

  // gold accent bar
  ctx.fillStyle = "#c9a227";
  ctx.fillRect(0, 0, W, 8);

  ctx.fillStyle = "#c9a227";
  ctx.font = "600 18px Outfit, sans-serif";
  ctx.fillText("NOVA FENCE · SITE MEASURE", 40, 52);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 36px Outfit, sans-serif";
  ctx.fillText("上门测量预约", 40, 100);

  const wd = WEEKDAY_ZH[a.weekday] || WEEKDAY_ZH[weekdayOf(a.appointment_date)] || "";
  const rows = [
    ["客户", a.name || "—"],
    ["电话", a.phone || "—"],
    ["时间", `${formatDateZh(a.appointment_date)}${wd ? `（${wd}）` : ""}${a.appointment_time ? `  ${a.appointment_time}` : ""}`],
    ["地址", a.address || "—"],
  ];
  if (a.email) rows.push(["邮箱", a.email]);
  if (a.notes) rows.push(["备注", a.notes]);

  let y = 150;
  rows.forEach(([label, value]) => {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "600 15px Outfit, sans-serif";
    ctx.fillText(label, 40, y);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 22px Outfit, sans-serif";
    wrapText(ctx, value, 40, y + 28, W - 80, 28);
    y += value.length > 28 ? 78 : 62;
  });

  ctx.fillStyle = "#c9a227";
  ctx.font = "600 15px Outfit, sans-serif";
  ctx.fillText("文字含 Google / Apple 地图链接（点开即带地址）· 周三/周六", 40, H - 28);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = String(text);
  let line = "";
  let yy = y;
  for (let i = 0; i < chars.length; i += 1) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = chars[i];
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

export default function AdminAppointments() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [nameQ, setNameQ] = useState("");
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [preview, setPreview] = useState(null);
  const [noteDraft, setNoteDraft] = useState({});
  const [savingId, setSavingId] = useState(null);
  const canvasRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = () => {
    api.appointments({ weekday: filter })
      .then((rows) => {
        setList(rows);
        setNoteDraft((prev) => {
          const next = { ...prev };
          rows.forEach((r) => {
            if (next[r.id] === undefined) next[r.id] = r.notes || "";
          });
          return next;
        });
        setErr("");
      })
      .catch((e) => setErr(String(e.message || e)));
  };

  useEffect(load, [filter]);

  const liveWeekday = weekdayOf(form.appointment_date);
  const invalidDay = form.appointment_date && !liveWeekday;

  const visible = useMemo(() => {
    const q = nameQ.trim();
    return list
      .filter((a) => {
        if (statusFilter === "scheduled" && a.status === "completed") return false;
        if (statusFilter === "completed" && a.status !== "completed") return false;
        if (q && !fuzzyMatch(a.name, q) && !fuzzyMatch(a.phone, q)) return false;
        return true;
      })
      .sort((a, b) => apptSortKey(a).localeCompare(apptSortKey(b)));
  }, [list, statusFilter, nameQ]);

  const filteredHint = useMemo(() => {
    const done = list.filter((a) => a.status === "completed").length;
    const pending = list.filter((a) => a.status !== "completed").length;
    return { done, pending, total: list.length, shown: visible.length };
  }, [list, visible]);

  const reset = () => {
    setForm(empty);
    setEditingId(null);
    setOk("");
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setOk("");
    try {
      if (!liveWeekday) throw new Error("预约日期必须是周三或周六");
      const payload = { ...form };
      const wasEdit = !!editingId;
      const row = wasEdit
        ? await api.updateAppointment(editingId, payload)
        : await api.createAppointment(payload);
      setForm(empty);
      setEditingId(null);
      setPreview(row);
      setOk(wasEdit ? "已更新预约，卡片已生成" : "已创建预约，卡片已生成");
      load();
    } catch (ex) {
      setErr(String(ex.message || ex));
    } finally {
      setBusy(false);
    }
  };

  const edit = (a) => {
    setEditingId(a.id);
    setForm({
      name: a.name || "",
      phone: a.phone || "",
      email: a.email || "",
      appointment_date: a.appointment_date || "",
      appointment_time: a.appointment_time || "",
      address: a.address || "",
      notes: a.notes || "",
      status: a.status || "scheduled",
    });
    setPreview(a);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const patchRow = async (a, patch) => {
    setSavingId(a.id);
    setErr("");
    try {
      const row = await api.updateAppointment(a.id, { ...a, ...patch });
      setList((rows) => rows.map((r) => (r.id === a.id ? row : r)));
      if (preview?.id === a.id) setPreview(row);
      if (patch.notes !== undefined) {
        setNoteDraft((d) => ({ ...d, [a.id]: row.notes || "" }));
      }
      setOk(patch.status === "completed" ? "已标记测量完成" : patch.status === "scheduled" ? "已改回待测量" : "备注已保存");
    } catch (ex) {
      setErr(String(ex.message || ex));
    } finally {
      setSavingId(null);
    }
  };

  const toggleDone = (a) => {
    const next = a.status === "completed" ? "scheduled" : "completed";
    patchRow(a, { status: next });
  };

  const saveNotes = (a) => {
    const notes = (noteDraft[a.id] ?? a.notes ?? "").trim();
    if (notes === (a.notes || "")) return;
    patchRow(a, { notes });
  };

  const remove = async (a) => {
    if (!confirm(`删除 ${a.name} 的测量预约？`)) return;
    await api.deleteAppointment(a.id);
    if (preview?.id === a.id) setPreview(null);
    load();
  };

  const openCard = (a) => setPreview(a);

  useEffect(() => {
    if (preview && canvasRef.current) drawShareCard(canvasRef.current, preview);
  }, [preview]);

  const copyText = async (a) => {
    const text = shareText(a);
    try {
      await navigator.clipboard.writeText(text);
      setOk("已复制文字卡片，可直接粘贴到群里");
    } catch {
      setErr("复制失败，请手动选择文字");
    }
  };

  const downloadPng = () => {
    if (!canvasRef.current || !preview) return;
    drawShareCard(canvasRef.current, preview);
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL("image/png");
    a.download = `nova-measure-${preview.appointment_date}-${preview.name || "card"}.png`;
    a.click();
    setOk("已下载图片卡片，可发到微信 / 群聊");
  };

  const shareNative = async (a) => {
    const text = shareText(a);
    if (navigator.share) {
      try {
        await navigator.share({ title: "NOVA 上门测量", text });
        return;
      } catch { /* fall through */ }
    }
    copyText(a);
  };

  return (
    <div className="orders-main appt-page">
      <div className="orders-head">
        <div>
          <p className="ts-eyebrow">Wed / Sat · Site measure</p>
          <h2 style={{ margin: "0.2rem 0 0" }}>
            周三 / 周六上门测量
            <span className="muted" style={{ fontSize: "1rem", fontWeight: 500 }}>
              {" "}· 显示 {filteredHint.shown}/{filteredHint.total}
              <span style={{ marginLeft: "0.5rem" }}>未测 {filteredHint.pending} · 完成 {filteredHint.done}</span>
            </span>
          </h2>
          <p className="muted">录入客户与预约信息，生成小卡片分享到群；下方列表可搜索、按时间排序、筛选未测/完成。</p>
        </div>
        <div className="toolbar" style={{ margin: 0 }}>
          {["all", "wed", "sat"].map((k) => (
            <button
              key={k}
              type="button"
              className={`btn btn-sm ${filter === k ? "btn-primary" : "btn-ghost ts-glass"}`}
              onClick={() => setFilter(k)}
            >
              {k === "all" ? "全部" : k === "wed" ? "周三" : "周六"}
            </button>
          ))}
        </div>
      </div>

      <div className="appt-layout">
        <form className="ts-glass appt-form" onSubmit={save}>
          <h3 style={{ margin: "0 0 0.75rem" }}>
            {editingId ? "编辑预约" : "新建测量预约"}
          </h3>
          <div className="form-grid">
            <div className="field">
              <label>姓名 *</label>
              <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="王先生" />
            </div>
            <div className="field">
              <label>电话 *</label>
              <input required value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="04xx xxx xxx" />
            </div>
            <div className="field">
              <label>邮箱（可选）</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="optional@" />
            </div>
            <div className="field">
              <label>预约日期 *（仅周三 / 周六）</label>
              <input
                required
                type="date"
                value={form.appointment_date}
                onChange={(e) => set("appointment_date", e.target.value)}
              />
            </div>
            <div className="field">
              <label>周几</label>
              <input
                readOnly
                value={
                  liveWeekday
                    ? `${WEEKDAY_ZH[liveWeekday]} · ${WEEKDAY_EN[liveWeekday]}`
                    : form.appointment_date
                      ? "不是周三或周六"
                      : "选择日期后自动显示"
                }
              />
            </div>
            <div className="field">
              <label>预约时间（可选）</label>
              <input
                type="time"
                value={form.appointment_time}
                onChange={(e) => set("appointment_time", e.target.value)}
              />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>居住地址 *</label>
              <input
                required
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Street, Suburb QLD postcode"
              />
              {form.address.trim() && (
                <span className="maps-link-row">
                  <a className="maps-link" href={googleMapsUrl(form.address)} target="_blank" rel="noreferrer">
                    Google 地图 ↗
                  </a>
                  <a className="maps-link" href={appleMapsUrl(form.address)} target="_blank" rel="noreferrer">
                    Apple 地图 ↗
                  </a>
                </span>
              )}
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>备注（可选）</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="门禁 / 停车 / 现场情况等"
                rows={2}
              />
            </div>
            <label className="appt-done-check">
              <input
                type="checkbox"
                checked={form.status === "completed"}
                onChange={(e) => set("status", e.target.checked ? "completed" : "scheduled")}
              />
              测量完成 · Measurement completed
            </label>
          </div>

          <div className="toolbar" style={{ marginTop: "0.85rem" }}>
            <button type="button" className="btn btn-ghost btn-sm ts-glass" onClick={() => set("appointment_date", nextWeekdayDate(3))}>
              下个周三
            </button>
            <button type="button" className="btn btn-ghost btn-sm ts-glass" onClick={() => set("appointment_date", nextWeekdayDate(6))}>
              下个周六
            </button>
          </div>

          {invalidDay && <p className="err">测量日只能选周三或周六</p>}
          {err && <p className="err">{err}</p>}
          {ok && <p className="ok">{ok}</p>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={busy || invalidDay}>
              {busy ? "保存中…" : editingId ? "更新并生成卡片" : "保存并生成卡片"}
            </button>
            {editingId && (
              <button type="button" className="btn btn-ghost ts-glass" onClick={reset}>
                取消编辑
              </button>
            )}
          </div>
        </form>

        <aside className="ts-glass appt-card-panel">
          <h3 style={{ margin: "0 0 0.65rem" }}>分享小卡片</h3>
          {preview ? (
            <>
              <div className="appt-share-preview">
                <canvas ref={canvasRef} className="appt-share-canvas" />
              </div>
              <p className="appt-share-text">{shareText(preview)}</p>
              <div className="toolbar">
                <button type="button" className="btn btn-primary" onClick={() => copyText(preview)}>
                  复制文字到群
                </button>
                <button type="button" className="btn btn-ghost ts-glass" onClick={downloadPng}>
                  下载图片卡片
                </button>
                <button type="button" className="btn btn-ghost ts-glass" onClick={() => shareNative(preview)}>
                  系统分享
                </button>
                <a
                  className="btn btn-ghost ts-glass"
                  href={mapLinks(preview).google}
                  target="_blank"
                  rel="noreferrer"
                >
                  Google 地图
                </a>
                <a
                  className="btn btn-ghost ts-glass"
                  href={mapLinks(preview).apple}
                  target="_blank"
                  rel="noreferrer"
                >
                  Apple 地图
                </a>
              </div>
            </>
          ) : (
            <p className="muted">保存预约后，这里会生成可分享的上门测量卡片。</p>
          )}
        </aside>
      </div>

      <div className="appt-list-tools ts-glass">
        <div className="search-bar appt-search">
          <input
            type="search"
            value={nameQ}
            onChange={(e) => setNameQ(e.target.value)}
            placeholder="搜索客户姓名 / 电话…"
            aria-label="Search by customer name"
          />
          {nameQ && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setNameQ("")}>
              清除
            </button>
          )}
        </div>
        <div className="toolbar appt-status-filters" style={{ margin: 0 }}>
          {[
            { id: "all", label: "所有" },
            { id: "scheduled", label: "未测量" },
            { id: "completed", label: "测量完成" },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              className={`btn btn-sm ${statusFilter === s.id ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setStatusFilter(s.id)}
            >
              {s.label}
            </button>
          ))}
          <span className="muted" style={{ fontSize: "0.82rem", marginLeft: "0.25rem" }}>
            按预约时间排序
          </span>
        </div>
      </div>

      <div className="order-table ts-glass" style={{ marginTop: "0.75rem" }}>
        <div className="order-row order-head appt-row">
          <span>客户 / 电话</span>
          <span>日期 / 状态</span>
          <span>地址 / 备注</span>
          <span></span>
        </div>
        {visible.length === 0 ? (
          <p className="muted" style={{ padding: "1rem" }}>
            {list.length === 0 ? "暂无预约" : nameQ || statusFilter !== "all" ? "没有匹配的客户" : "暂无预约"}
          </p>
        ) : (
          visible.map((a) => {
            const done = a.status === "completed";
            const draft = noteDraft[a.id] ?? a.notes ?? "";
            const noteDirty = draft !== (a.notes || "");
            return (
              <div key={a.id} className={`order-row appt-row ${done ? "appt-done" : ""}`}>
                <span>
                  <strong>{a.name}</strong>
                  <br />
                  <span className="muted">{a.phone}{a.email ? ` · ${a.email}` : ""}</span>
                </span>
                <span>
                  {formatDateZh(a.appointment_date)}
                  <br />
                  <span className="muted">
                    {WEEKDAY_ZH[a.weekday] || a.weekday}
                    {a.appointment_time ? ` · ${a.appointment_time}` : ""}
                  </span>
                  <br />
                  <span className={`appt-status ${done ? "is-done" : "is-pending"}`}>
                    {done ? "测量完成" : "待测量"}
                  </span>
                </span>
                <span className="appt-addr-notes">
                  <span className="appt-addr-line">{a.address}</span>
                  <span className="maps-link-row" onClick={(e) => e.stopPropagation()}>
                    <a className="maps-link" href={mapLinks(a).google} target="_blank" rel="noreferrer">
                      Google
                    </a>
                    <a className="maps-link" href={mapLinks(a).apple} target="_blank" rel="noreferrer">
                      Apple
                    </a>
                  </span>
                  <div className="appt-note-row" onClick={(e) => e.stopPropagation()}>
                    <input
                      className="appt-note-input"
                      value={draft}
                      placeholder="添加备注…"
                      onChange={(e) => setNoteDraft((d) => ({ ...d, [a.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveNotes(a);
                      }}
                      onBlur={() => saveNotes(a)}
                    />
                    {noteDirty && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={savingId === a.id}
                        onClick={() => saveNotes(a)}
                      >
                        存
                      </button>
                    )}
                  </div>
                </span>
                <span className="order-actions appt-actions" onClick={(e) => e.stopPropagation()}>
                  <label className="appt-done-check compact">
                    <input
                      type="checkbox"
                      checked={done}
                      disabled={savingId === a.id}
                      onChange={() => toggleDone(a)}
                    />
                    完成
                  </label>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => openCard(a)}>
                    卡片
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => edit(a)}>
                    编辑
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => remove(a)}>
                    删除
                  </button>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
