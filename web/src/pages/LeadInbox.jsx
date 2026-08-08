import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

const STATUSES = [
  { id: "new", zh: "新咨询" },
  { id: "quoted", zh: "已发报价" },
  { id: "deposit_paid", zh: "已付定金" },
  { id: "done", zh: "已完工" },
];

const ACTION_LABEL = {
  create: "新建",
  update: "修改",
  delete: "删除",
  photo_add: "上传照片",
  photo_delete: "删除照片",
};

const empty = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  quotation: "",
  status: "new",
  source: "",
};

async function fileToCompressedDataUrl(file, maxSide = 1000, quality = 0.72) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", quality);
}

async function fileToThumbAndFull(file) {
  const [thumb, dataUrl] = await Promise.all([
    fileToCompressedDataUrl(file, 280, 0.62),
    fileToCompressedDataUrl(file, 1000, 0.72),
  ]);
  return { thumb, dataUrl };
}

function formatWhen(iso) {
  if (!iso) return "—";
  return String(iso).replace("T", " ").slice(0, 16);
}

export default function LeadInbox() {
  const [list, setList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [viewer, setViewer] = useState(null);
  // { kind, title, body, step, maxStep, payload }
  const [confirmDlg, setConfirmDlg] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const loadLogs = () => {
    api.inboxLogs(50)
      .then(setLogs)
      .catch(() => {});
  };

  const load = () => {
    api.inbox({ status: filter })
      .then((rows) => {
        setList(rows);
        setErr("");
      })
      .catch((e) => setErr(String(e.message || e)));
    loadLogs();
  };

  useEffect(load, [filter]);

  const counts = useMemo(() => {
    const m = { all: list.length };
    STATUSES.forEach((s) => { m[s.id] = 0; });
    list.forEach((r) => { m[r.status] = (m[r.status] || 0) + 1; });
    return m;
  }, [list]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setOk("");
    try {
      const status = form.status;
      await api.createInbox(form);
      setForm(empty);
      setOk("已添加来客");
      if (filter !== "all" && filter !== status) setFilter("all");
      else load();
    } catch (ex) {
      setErr(String(ex.message || ex));
    } finally {
      setBusy(false);
    }
  };

  const patch = async (row, partial) => {
    setErr("");
    try {
      const next = await api.updateInbox(row.id, { ...row, ...partial });
      setList((rows) => rows.map((r) => (r.id === row.id ? next : r)));
      loadLogs();
    } catch (ex) {
      setErr(String(ex.message || ex));
      load();
    }
  };

  const askDeleteLead = (row) => {
    setConfirmDlg({
      kind: "lead",
      title: "删除来客？",
      body: `将永久删除「${row.name || "未命名"}」及其全部照片，此操作不可恢复。`,
      step: 1,
      maxStep: 2,
      payload: row,
    });
  };

  const askDeletePhoto = (row, photo) => {
    setConfirmDlg({
      kind: "photo",
      title: "删除照片？",
      body: `确定删除「${row.name || "来客"}」的这张照片${photo?.name ? `（${photo.name}）` : ""}？删除后无法恢复。`,
      step: 1,
      maxStep: 2,
      payload: { row, photoId: photo.id },
    });
  };

  const runConfirmedDelete = async () => {
    if (!confirmDlg) return;
    const { kind, step, maxStep, payload } = confirmDlg;
    if (step < maxStep) {
      setConfirmDlg({
        ...confirmDlg,
        step: step + 1,
        title: kind === "lead" ? "再次确认删除来客" : "再次确认删除照片",
        body: kind === "lead"
          ? `请再次确认：删除「${payload.name || "未命名"}」及全部照片。点「确认删除」后立即执行。`
          : `请再次确认删除该照片。点「确认删除」后立即执行。`,
      });
      return;
    }
    setConfirmDlg(null);
    setErr("");
    try {
      if (kind === "lead") {
        await api.deleteInbox(payload.id);
        setOk(`已删除「${payload.name || "来客"}」`);
        load();
      } else {
        const { row, photoId } = payload;
        const res = await api.deleteInboxPhoto(row.id, photoId);
        setList((rows) => rows.map((r) => (r.id === row.id ? { ...r, photos: res.photos } : r)));
        setOk("照片已删除");
        loadLogs();
      }
    } catch (ex) {
      setErr(String(ex.message || ex));
    }
  };

  const onUpload = async (row, fileList) => {
    const files = [...(fileList || [])];
    if (!files.length) return;
    setUploading(row.id);
    setErr("");
    try {
      let photos = row.photos || [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        const { thumb, dataUrl } = await fileToThumbAndFull(file);
        const res = await api.addInboxPhoto(row.id, { dataUrl, thumb, name: file.name });
        photos = res.photos;
      }
      setList((rows) => rows.map((r) => (r.id === row.id ? { ...r, photos } : r)));
      setOk("照片已上传");
      loadLogs();
    } catch (ex) {
      setErr(String(ex.message || ex));
    } finally {
      setUploading(null);
    }
  };

  const openPhoto = async (row, index) => {
    const plist = row.photos || [];
    const p = plist[index];
    if (!p) return;
    setViewer({
      leadId: row.id,
      list: plist,
      index,
      name: p.name,
      src: p.thumb || "",
      loading: true,
    });
    try {
      const full = await api.getInboxPhoto(row.id, p.id);
      setViewer((v) => (v && v.leadId === row.id && v.index === index
        ? { ...v, src: full.dataUrl, name: full.name || p.name, loading: false }
        : v));
    } catch (ex) {
      setErr(String(ex.message || ex));
      setViewer((v) => (v ? { ...v, loading: false } : v));
    }
  };

  const stepViewer = async (delta) => {
    if (!viewer) return;
    const n = viewer.index + delta;
    if (!viewer.list[n]) return;
    const p = viewer.list[n];
    setViewer({ ...viewer, index: n, name: p.name, src: p.thumb || viewer.src, loading: true });
    try {
      const full = await api.getInboxPhoto(viewer.leadId, p.id);
      setViewer((v) => (v && v.index === n
        ? { ...v, src: full.dataUrl, name: full.name || p.name, loading: false }
        : v));
    } catch {
      setViewer((v) => (v ? { ...v, loading: false } : v));
    }
  };

  return (
    <div className="orders-main inbox-page">
      <div className="orders-head">
        <div>
          <p className="ts-eyebrow">Facebook · Phone · Walk-in</p>
          <h2 style={{ margin: "0.2rem 0 0" }}>
            来客跟进
            <span className="muted" style={{ fontSize: "1rem", fontWeight: 500 }}> · {list.length}</span>
          </h2>
          <p className="muted">
            从各平台复制客户信息粘贴进来。删除来客或照片需两次确认。下方操作记录会写明新建/删除的完整字段。
          </p>
        </div>
      </div>

      <form className="ts-glass inbox-create" onSubmit={save}>
        <h3 style={{ margin: "0 0 0.75rem" }}>新建来客</h3>
        <div className="inbox-create-grid">
          <div className="field">
            <label>姓名 *</label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="粘贴姓名" />
          </div>
          <div className="field">
            <label>电话</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="04xx…" />
          </div>
          <div className="field">
            <label>邮箱</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="field">
            <label>报价号 Quotation</label>
            <input
              value={form.quotation}
              onChange={(e) => set("quotation", e.target.value)}
              placeholder="QU-0149 或 0149"
            />
          </div>
          <div className="field">
            <label>来源</label>
            <input value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="Facebook / 电话 / …" />
          </div>
          <div className="field">
            <label>初始状态</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>{s.zh}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>地址</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Suburb / street" />
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>备注</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="客户原话 / 需求" />
          </div>
        </div>
        {err && <p className="err">{err}</p>}
        {ok && <p className="ok">{ok}</p>}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "保存中…" : "添加一行"}
          </button>
        </div>
      </form>

      <div className="toolbar inbox-filters">
        <button
          type="button"
          className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-ghost ts-glass"}`}
          onClick={() => setFilter("all")}
        >
          全部
        </button>
        {STATUSES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`btn btn-sm ${filter === s.id ? "btn-primary" : "btn-ghost ts-glass"}`}
            onClick={() => setFilter(s.id)}
          >
            {s.zh}
            {filter === "all" && counts[s.id] ? ` · ${counts[s.id]}` : ""}
          </button>
        ))}
      </div>

      <div className="inbox-list">
        {list.length === 0 ? (
          <div className="ts-glass quote-panel">
            <p className="muted">暂无来客。把 Facebook / 电话信息填进上方表单即可。</p>
          </div>
        ) : (
          list.map((row, idx) => (
            <article
              key={row.id}
              className={`inbox-card ts-glass${row.status === "deposit_paid" ? " inbox-card-deposit" : ""}`}
            >
              <div className="inbox-seq">#{idx + 1}</div>
              <div className="inbox-main">
                <div className="inbox-fields">
                  <div className="field">
                    <label>姓名</label>
                    <input
                      value={row.name || ""}
                      onChange={(e) => setList((rows) => rows.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)))}
                      onBlur={(e) => patch(row, { name: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>电话</label>
                    <input
                      value={row.phone || ""}
                      onChange={(e) => setList((rows) => rows.map((r) => (r.id === row.id ? { ...r, phone: e.target.value } : r)))}
                      onBlur={(e) => patch(row, { phone: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>邮箱</label>
                    <input
                      value={row.email || ""}
                      onChange={(e) => setList((rows) => rows.map((r) => (r.id === row.id ? { ...r, email: e.target.value } : r)))}
                      onBlur={(e) => patch(row, { email: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Quotation</label>
                    <input
                      value={row.quotation || ""}
                      placeholder="QU-"
                      onChange={(e) => setList((rows) => rows.map((r) => (r.id === row.id ? { ...r, quotation: e.target.value } : r)))}
                      onBlur={(e) => patch(row, { quotation: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>状态</label>
                    <select
                      value={row.status || "new"}
                      onChange={(e) => patch(row, { status: e.target.value })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.id} value={s.id}>{s.zh}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>来源</label>
                    <input
                      value={row.source || ""}
                      onChange={(e) => setList((rows) => rows.map((r) => (r.id === row.id ? { ...r, source: e.target.value } : r)))}
                      onBlur={(e) => patch(row, { source: e.target.value })}
                    />
                  </div>
                  <div className="field inbox-span-2">
                    <label>地址</label>
                    <input
                      value={row.address || ""}
                      onChange={(e) => setList((rows) => rows.map((r) => (r.id === row.id ? { ...r, address: e.target.value } : r)))}
                      onBlur={(e) => patch(row, { address: e.target.value })}
                    />
                  </div>
                  <div className="field inbox-span-2">
                    <label>备注</label>
                    <textarea
                      rows={2}
                      value={row.notes || ""}
                      onChange={(e) => setList((rows) => rows.map((r) => (r.id === row.id ? { ...r, notes: e.target.value } : r)))}
                      onBlur={(e) => patch(row, { notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="inbox-meta">
                  <span className="muted">录入 {formatWhen(row.created_at)}</span>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => askDeleteLead(row)}>删除</button>
                </div>
              </div>

              <div className="inbox-photos">
                <div className="inbox-photo-grid">
                  {(row.photos || []).map((p, pi) => (
                    <div key={p.id} className="inbox-photo">
                      <button
                        type="button"
                        className="inbox-photo-open"
                        onClick={() => openPhoto(row, pi)}
                        title="点击放大"
                      >
                        <img src={p.thumb || p.dataUrl} alt={p.name || "photo"} />
                      </button>
                      <button
                        type="button"
                        className="inbox-photo-x"
                        onClick={() => askDeletePhoto(row, p)}
                        aria-label="Remove photo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <label className={`btn btn-sm btn-primary inbox-upload ${uploading === row.id ? "disabled" : ""}`}>
                  {uploading === row.id
                    ? "上传中…"
                    : `Upload 照片 (${(row.photos || []).length}/6)`}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    disabled={uploading === row.id || (row.photos || []).length >= 6}
                    onChange={(e) => {
                      onUpload(row, e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </article>
          ))
        )}
      </div>

      <section className="ts-glass inbox-log-panel" aria-label="操作记录">
        <div className="inbox-log-head">
          <div>
            <p className="ts-eyebrow">History</p>
            <h3 style={{ margin: "0.15rem 0 0" }}>操作记录</h3>
          </div>
          <button type="button" className="btn btn-sm btn-ghost" onClick={loadLogs}>刷新</button>
        </div>
        {logs.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>暂无操作记录。新建、修改、上传/删除照片都会写在这里。</p>
        ) : (
          <ul className="inbox-log-list">
            {logs.map((log) => (
              <li key={log.id} className="inbox-log-item">
                <span className="inbox-log-time">{formatWhen(log.created_at)}</span>
                <span className={`inbox-log-action action-${log.action}`}>
                  {ACTION_LABEL[log.action] || log.action}
                </span>
                <span className="inbox-log-name">{log.lead_name || "—"}</span>
                <span className="inbox-log-detail muted">{log.detail || ""}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {confirmDlg && (
        <div
          className="confirm-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmDlg(null)}
        >
          <div className="confirm-modal-card ts-glass" onClick={(e) => e.stopPropagation()}>
            <p className="ts-eyebrow">确认 {confirmDlg.step}/{confirmDlg.maxStep}</p>
            <h3 style={{ margin: "0.25rem 0 0.5rem" }}>{confirmDlg.title}</h3>
            <p className="muted" style={{ margin: "0 0 1rem" }}>{confirmDlg.body}</p>
            <div className="toolbar" style={{ margin: 0, justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmDlg(null)}>
                取消
              </button>
              <button type="button" className="btn btn-sm btn-primary" onClick={runConfirmedDelete}>
                {confirmDlg.step < confirmDlg.maxStep ? "继续" : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewer && (
        <div
          className="photo-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setViewer(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setViewer(null);
            if (e.key === "ArrowRight") stepViewer(1);
            if (e.key === "ArrowLeft") stepViewer(-1);
          }}
          tabIndex={-1}
          ref={(el) => el?.focus()}
        >
          <div className="photo-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <img src={viewer.src} alt={viewer.name || "photo"} />
            {viewer.loading && <p className="muted" style={{ color: "#fff", margin: 0 }}>加载大图…</p>}
            <div className="photo-lightbox-bar">
              <span className="muted" style={{ color: "oklch(0.9 0.02 255)" }}>
                {(viewer.index ?? 0) + 1}/{viewer.list?.length || 1}
                {viewer.name ? ` · ${viewer.name}` : ""}
              </span>
              <div className="toolbar" style={{ margin: 0 }}>
                {viewer.list?.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      disabled={viewer.index <= 0 || viewer.loading}
                      onClick={() => stepViewer(-1)}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      disabled={viewer.index >= viewer.list.length - 1 || viewer.loading}
                      onClick={() => stepViewer(1)}
                    >
                      →
                    </button>
                  </>
                )}
                <a className="btn btn-sm btn-ghost" href={viewer.src} download={viewer.name || "photo.jpg"}>
                  下载
                </a>
                <button type="button" className="btn btn-sm btn-primary" onClick={() => setViewer(null)}>
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
