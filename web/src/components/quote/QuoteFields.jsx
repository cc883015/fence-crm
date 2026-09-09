import React from "react";
import { effectivePrice, money } from "../../lib/quoteMath.js";

export function ModuleCard({ title, zh, enabled, subtotal, onToggle, disabled, children }) {
  return (
    <section className={`qq-mod ts-glass ${enabled ? "" : "is-off"}`}>
      <header className="qq-mod-h">
        <label className="qq-switch">
          <input type="checkbox" checked={!!enabled} onChange={onToggle} disabled={disabled} />
          <span>
            <strong>{title}</strong>
            {zh ? <em>{zh}</em> : null}
          </span>
        </label>
        <span className="qq-mod-sum">{money(enabled ? subtotal : 0)}</span>
      </header>
      <div className="qq-mod-b">{children}</div>
    </section>
  );
}

export function Field({ label, children, wide }) {
  return (
    <div className={`field ${wide ? "qq-wide" : ""}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

export function PriceField({ line, onCustomPrice, disabled, unit }) {
  const def = Number(line.defaultPrice) || 0;
  const display = line.customPrice === null || line.customPrice === undefined || line.customPrice === ""
    ? (def === 0 ? "" : def)
    : line.customPrice;
  const overridden = line.customPrice !== null && line.customPrice !== undefined && line.customPrice !== "";
  const u = unit || line.customUnit || line.unit || "";
  const eff = effectivePrice(line);

  return (
    <div className="field qq-price-field">
      <label>Price {u ? <span className="muted">/ {u}</span> : null}</label>
      <input
        type="number"
        min="0"
        step="1"
        inputMode="decimal"
        disabled={disabled}
        value={display}
        onChange={(e) => onCustomPrice(e.target.value)}
      />
      <small className={overridden ? "ok" : "muted"}>
        Default {money(def)}
        {overridden ? ` · now ${money(eff)}` : ""}
        {overridden ? (
          <button type="button" className="qq-link" disabled={disabled} onClick={() => onCustomPrice(null)}>
            Reset
          </button>
        ) : null}
      </small>
    </div>
  );
}

export function AdvancedBlock({ open, onToggle, disabled, children, forceOpen }) {
  const show = forceOpen || open;
  return (
    <div className="qq-adv">
      {!forceOpen && (
        <button type="button" className="qq-link" disabled={disabled} onClick={onToggle}>
          {show ? "Hide Advanced / Custom" : "Advanced / Custom"}
        </button>
      )}
      {show ? <div className="qq-adv-grid">{children}</div> : null}
    </div>
  );
}

export function typeOptions(catalog, keys) {
  return keys.map((id) => {
    const c = catalog[id];
    return (
      <option key={id} value={id}>
        {c.name} / {c.nameZh}
      </option>
    );
  });
}
