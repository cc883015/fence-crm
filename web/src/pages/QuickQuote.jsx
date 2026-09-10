import React, { useEffect, useMemo, useState } from "react";
import {
  AccessoriesModule,
  BrickPillarsModule,
  BrickWallModule,
  ColorbondModule,
  FenceModule,
  InstallationModule,
  MotorModule,
  OtherModule,
  PedestrianGateModule,
  PostsModule,
  RemovalModule,
  RetainingModule,
  SlidingGateModule,
} from "../components/quote/QuoteModules.jsx";
import QuoteHistory from "../components/quote/QuoteHistory.jsx";
import QuoteSummary from "../components/quote/QuoteSummary.jsx";
import { createEmptyQuote, duplicateQuote, hydrateQuote, summarizeQuote } from "../lib/quoteModel.js";
import { deleteQuoteRemote, getLocalQuote, listQuotes, saveQuoteRemote } from "../lib/quoteStorage.js";

export default function QuickQuote() {
  const [quote, setQuote] = useState(() => createEmptyQuote());
  const [history, setHistory] = useState([]);
  const [mode, setMode] = useState("edit");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const locked = mode === "view";
  const summary = useMemo(() => summarizeQuote(quote), [quote]);

  const refreshHistory = () => {
    listQuotes().then(setHistory).catch(() => setHistory([]));
  };

  useEffect(refreshHistory, []);

  const setMod = (key) => (next) => {
    setQuote((q) => ({ ...q, modules: { ...q.modules, [key]: next } }));
  };

  const save = async () => {
    const name = (quote.customerName || "").trim();
    if (!name) {
      setErr("Please enter customer name.");
      setMsg("");
      return;
    }
    setErr("");
    setSaving(true);
    try {
      const next = { ...quote, customerName: name, status: "saved" };
      setQuote(next);
      const row = await saveQuoteRemote(next);
      setMsg(row.remote ? "Quote saved." : "Quote saved on this device.");
      refreshHistory();
    } finally {
      setSaving(false);
    }
  };

  const newQuote = () => {
    setQuote(createEmptyQuote());
    setMode("edit");
    setErr("");
    setMsg("");
  };

  const clearQuote = () => {
    const id = quote.quoteId;
    const date = quote.date;
    const blank = createEmptyQuote();
    blank.quoteId = id;
    blank.date = date;
    setQuote(blank);
    setErr("");
    setMsg("");
    setMode("edit");
  };

  const loadRow = (quoteId, nextMode) => {
    const payload = getLocalQuote(quoteId) || history.find((h) => h.quoteId === quoteId)?.payload;
    if (!payload) return;
    setQuote(hydrateQuote(payload));
    setMode(nextMode);
    setErr("");
    setMsg(nextMode === "view" ? "Viewing saved quote." : "Editing saved quote.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDuplicate = (quoteId) => {
    const payload = getLocalQuote(quoteId) || history.find((h) => h.quoteId === quoteId)?.payload;
    if (!payload) return;
    setQuote(duplicateQuote(payload));
    setMode("edit");
    setErr("");
    setMsg("Duplicated. Save to keep a copy.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (quoteId) => {
    if (!window.confirm(`Delete ${quoteId}?`)) return;
    await deleteQuoteRemote(quoteId);
    if (quote.quoteId === quoteId) newQuote();
    refreshHistory();
  };

  return (
    <div className="orders-main">
    <div className="qq">
      <header className="qq-top ts-glass">
        <div className="qq-top-l">
          <p className="ts-eyebrow">Quick Quote · 30s</p>
          <label className="qq-name">
            <span>Customer Name / 客户姓名 *</span>
            <input
              autoFocus
              disabled={locked}
              value={quote.customerName}
              placeholder="Required to save"
              onChange={(e) => {
                setQuote((q) => ({ ...q, customerName: e.target.value }));
                if (err) setErr("");
              }}
            />
          </label>
          {err ? <p className="err">{err}</p> : null}
          {msg ? <p className="ok">{msg}</p> : null}
        </div>
        <div className="qq-top-r">
          <div className="qq-meta">
            <span>Quote ID <b className="mono">{quote.quoteId}</b></span>
            <span>Date <b>{quote.date}</b></span>
            {locked ? <span className="qq-st saved">view</span> : null}
          </div>
          <div className="qq-actions">
            {locked ? (
              <button type="button" className="btn btn-ghost btn-sm ts-glass" onClick={() => setMode("edit")}>
                Edit
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={save}>
                {saving ? "Saving…" : "Save Quote"}
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm ts-glass" onClick={newQuote}>
              New Quote
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearQuote}>
              Clear
            </button>
          </div>
        </div>
      </header>

      <div className="qq-layout">
        <div className="qq-mods">
          <FenceModule mod={quote.modules.fence} setMod={setMod("fence")} locked={locked} />
          <PedestrianGateModule mod={quote.modules.pedestrianGate} setMod={setMod("pedestrianGate")} locked={locked} />
          <SlidingGateModule mod={quote.modules.slidingGate} setMod={setMod("slidingGate")} locked={locked} />
          <MotorModule mod={quote.modules.motor} setMod={setMod("motor")} locked={locked} />
          <BrickWallModule mod={quote.modules.brickWall} setMod={setMod("brickWall")} locked={locked} />
          <BrickPillarsModule mod={quote.modules.brickPillars} setMod={setMod("brickPillars")} locked={locked} />
          <ColorbondModule mod={quote.modules.colorbond} setMod={setMod("colorbond")} locked={locked} />
          <PostsModule mod={quote.modules.posts} setMod={setMod("posts")} locked={locked} />
          <InstallationModule mod={quote.modules.installation} setMod={setMod("installation")} locked={locked} />
          <AccessoriesModule mod={quote.modules.accessories} setMod={setMod("accessories")} locked={locked} />
          <RetainingModule mod={quote.modules.retaining} setMod={setMod("retaining")} locked={locked} />
          <RemovalModule mod={quote.modules.removal} setMod={setMod("removal")} locked={locked} />
          <OtherModule mod={quote.modules.other} setMod={setMod("other")} locked={locked} />
        </div>
        <QuoteSummary
          summary={summary}
          discount={quote.discount}
          adjustment={quote.adjustment}
          locked={locked}
          onChange={(k, v) => setQuote((q) => ({ ...q, [k]: v }))}
        />
      </div>

      <QuoteHistory
        rows={history}
        onView={(id) => loadRow(id, "view")}
        onEdit={(id) => loadRow(id, "edit")}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
    </div>
    </div>
  );
}
