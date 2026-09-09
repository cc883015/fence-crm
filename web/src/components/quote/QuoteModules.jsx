import React from "react";
import {
  pricingConfig,
  FENCE_TYPES,
  GATE_TYPES,
  MOTOR_TYPES,
  POST_TYPES,
  RETAINING_TYPES,
  REMOVAL_TYPES,
} from "../../data/pricingConfig.js";
import { lineSubtotal, money } from "../../lib/quoteMath.js";
import { applyBrickPillarMethod, applyCatalogDefaults, applyFenceType } from "../../lib/quoteModel.js";
import { AdvancedBlock, Field, ModuleCard, PriceField, typeOptions } from "./QuoteFields.jsx";

function numInput(disabled, value, onChange, placeholder) {
  return (
    <input
      type="number"
      min="0"
      step="any"
      inputMode="decimal"
      disabled={disabled}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function CustomExtras({ line, set, disabled, descLabel = "Custom Description" }) {
  return (
    <>
      <Field label={descLabel} wide>
        <input
          disabled={disabled}
          value={line.customDescription}
          placeholder="e.g. Special aluminium panel"
          onChange={(e) => set({ customDescription: e.target.value })}
        />
      </Field>
      <Field label="Custom Size">
        <input
          disabled={disabled}
          value={line.customSize}
          placeholder="e.g. 2500 x 1500"
          onChange={(e) => set({ customSize: e.target.value })}
        />
      </Field>
      <Field label="Custom Unit">
        <input
          disabled={disabled}
          value={line.customUnit}
          placeholder={line.unit || "m / ea"}
          onChange={(e) => set({ customUnit: e.target.value, unit: e.target.value || line.unit })}
        />
      </Field>
    </>
  );
}

export function FenceModule({ mod, setMod, locked }) {
  const off = !mod.enabled || locked;
  const set = (p) => setMod({ ...mod, ...p });
  const isCustom = mod.type === "custom";

  return (
    <ModuleCard
      title="Fence"
      zh="围栏"
      enabled={mod.enabled}
      subtotal={lineSubtotal(mod)}
      onToggle={() => set({ enabled: !mod.enabled })}
      disabled={locked}
    >
      <div className="qq-row">
        <Field label="Type">
          <select
            disabled={off}
            value={mod.type}
            onChange={(e) => setMod(applyFenceType(mod, e.target.value, mod.calcMethod))}
          >
            {typeOptions(pricingConfig.fence, FENCE_TYPES)}
          </select>
        </Field>
        <Field label="Quote by">
          <select
            disabled={off}
            value={mod.calcMethod}
            onChange={(e) => setMod(applyFenceType(mod, mod.type, e.target.value))}
          >
            <option value="length">By Length 按长度</option>
            <option value="panel">By Panel Qty 按片数</option>
          </select>
        </Field>
        {mod.calcMethod === "panel" ? (
          <Field label="Qty (panels)">
            {numInput(off, mod.quantity, (v) => set({ quantity: v }))}
          </Field>
        ) : (
          <Field label="Length (m)">
            {numInput(off, mod.length, (v) => set({ length: v }), "e.g. 18")}
          </Field>
        )}
        <PriceField line={mod} disabled={off} onCustomPrice={(v) => set({ customPrice: v })} />
      </div>
      <AdvancedBlock
        open={mod.showAdvanced}
        forceOpen={isCustom}
        disabled={off}
        onToggle={() => set({ showAdvanced: !mod.showAdvanced })}
      >
        <CustomExtras line={mod} set={set} disabled={off} />
        {mod.calcMethod !== "panel" && (
          <Field label="Custom Qty">
            {numInput(off, mod.quantity, (v) => set({ quantity: v }))}
          </Field>
        )}
        <Field label="Size">
          <input disabled={off} value={mod.size} onChange={(e) => set({ size: e.target.value })} />
        </Field>
      </AdvancedBlock>
    </ModuleCard>
  );
}

export function PedestrianGateModule({ mod, setMod, locked }) {
  const off = !mod.enabled || locked;
  const set = (p) => setMod({ ...mod, ...p });
  const isCustom = mod.type === "custom";

  return (
    <ModuleCard
      title="Pedestrian Gate"
      zh="行人门"
      enabled={mod.enabled}
      subtotal={lineSubtotal(mod)}
      onToggle={() => set({ enabled: !mod.enabled })}
      disabled={locked}
    >
      <div className="qq-row">
        <Field label="Style">
          <select
            disabled={off}
            value={mod.type}
            onChange={(e) => setMod(applyCatalogDefaults(mod, pricingConfig.pedestrianGate, e.target.value))}
          >
            {typeOptions(pricingConfig.pedestrianGate, GATE_TYPES)}
          </select>
        </Field>
        <Field label="Size">
          <input disabled={off} value={mod.customSize || mod.size} onChange={(e) => set({ size: e.target.value, customSize: e.target.value })} />
        </Field>
        <Field label="Qty">
          {numInput(off, mod.quantity, (v) => set({ quantity: v }))}
        </Field>
        <PriceField line={mod} disabled={off} onCustomPrice={(v) => set({ customPrice: v })} />
      </div>
      <AdvancedBlock
        open={mod.showAdvanced}
        forceOpen={isCustom}
        disabled={off}
        onToggle={() => set({ showAdvanced: !mod.showAdvanced })}
      >
        <CustomExtras line={mod} set={set} disabled={off} />
      </AdvancedBlock>
    </ModuleCard>
  );
}

function SizeSelect({ label, presets, value, unit, disabled, onChange }) {
  const isPreset = presets.includes(String(value));
  const sel = isPreset ? String(value) : "custom";
  return (
    <Field label={label}>
      <div className="qq-split">
        <select
          disabled={disabled}
          value={sel}
          onChange={(e) => onChange(e.target.value === "custom" ? "" : e.target.value)}
        >
          {presets.map((p) => (
            <option key={p} value={p}>{p}{unit}</option>
          ))}
          <option value="custom">Custom</option>
        </select>
        {sel === "custom" && (
          <input
            disabled={disabled}
            value={value}
            placeholder="Custom"
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>
    </Field>
  );
}

export function SlidingGateModule({ mod, setMod, locked }) {
  const off = !mod.enabled || locked;
  const set = (p) => setMod({ ...mod, ...p });
  const isCustom = mod.type === "custom";
  const cfg = pricingConfig.slidingGate;

  return (
    <ModuleCard
      title="Sliding Gate"
      zh="滑动门"
      enabled={mod.enabled}
      subtotal={lineSubtotal(mod)}
      onToggle={() => set({ enabled: !mod.enabled })}
      disabled={locked}
    >
      <div className="qq-row">
        <Field label="Style">
          <select
            disabled={off}
            value={mod.type}
            onChange={(e) => setMod(applyCatalogDefaults(mod, cfg, e.target.value))}
          >
            {typeOptions(cfg, GATE_TYPES)}
          </select>
        </Field>
        <SizeSelect
          label="Width"
          presets={cfg.widths}
          value={mod.width}
          unit="m"
          disabled={off}
          onChange={(v) => set({ width: v })}
        />
        <SizeSelect
          label="Height"
          presets={cfg.heights}
          value={mod.height}
          unit="m"
          disabled={off}
          onChange={(v) => set({ height: v })}
        />
        <Field label="Qty">
          {numInput(off, mod.quantity, (v) => set({ quantity: v }))}
        </Field>
        <PriceField line={mod} disabled={off} onCustomPrice={(v) => set({ customPrice: v })} />
      </div>
      <AdvancedBlock
        open={mod.showAdvanced}
        forceOpen={isCustom}
        disabled={off}
        onToggle={() => set({ showAdvanced: !mod.showAdvanced })}
      >
        <CustomExtras line={mod} set={set} disabled={off} />
      </AdvancedBlock>
    </ModuleCard>
  );
}

export function MotorModule({ mod, setMod, locked }) {
  const off = !mod.enabled || locked;
  const set = (p) => setMod({ ...mod, ...p });
  const isCustom = mod.type === "custom";

  return (
    <ModuleCard
      title="Motor"
      zh="电机"
      enabled={mod.enabled}
      subtotal={lineSubtotal(mod)}
      onToggle={() => set({ enabled: !mod.enabled })}
      disabled={locked}
    >
      <div className="qq-row">
        <Field label="Motor Type">
          <select
            disabled={off}
            value={mod.type}
            onChange={(e) => setMod(applyCatalogDefaults(mod, pricingConfig.motor, e.target.value))}
          >
            {typeOptions(pricingConfig.motor, MOTOR_TYPES)}
          </select>
        </Field>
        <Field label="Qty">
          {numInput(off, mod.quantity, (v) => set({ quantity: v }))}
        </Field>
        <PriceField line={mod} disabled={off} onCustomPrice={(v) => set({ customPrice: v })} />
      </div>
      <AdvancedBlock
        open={mod.showAdvanced}
        forceOpen={isCustom}
        disabled={off}
        onToggle={() => set({ showAdvanced: !mod.showAdvanced })}
      >
        <CustomExtras line={mod} set={set} disabled={off} />
      </AdvancedBlock>
    </ModuleCard>
  );
}

export function BrickWallModule({ mod, setMod, locked }) {
  const off = !mod.enabled || locked;
  const set = (p) => setMod({ ...mod, ...p });

  return (
    <ModuleCard
      title="Brick Wall"
      zh="砖墙"
      enabled={mod.enabled}
      subtotal={lineSubtotal(mod)}
      onToggle={() => set({ enabled: !mod.enabled })}
      disabled={locked}
    >
      <div className="qq-row">
        <Field label="Length (m)">
          {numInput(off, mod.length, (v) => set({ length: v }), "e.g. 10")}
        </Field>
        <PriceField line={mod} disabled={off} unit="m" onCustomPrice={(v) => set({ customPrice: v })} />
      </div>
      <AdvancedBlock
        open={mod.showAdvanced}
        forceOpen={mod.type === "custom"}
        disabled={off}
        onToggle={() => set({ showAdvanced: !mod.showAdvanced })}
      >
        <CustomExtras line={mod} set={set} disabled={off} />
        <Field label="Custom Qty">
          {numInput(off, mod.quantity, (v) => set({ quantity: v, calcMethod: "qty" }))}
        </Field>
      </AdvancedBlock>
    </ModuleCard>
  );
}

export function BrickPillarsModule({ mod, setMod, locked }) {
  const off = !mod.enabled || locked;
  const set = (p) => setMod({ ...mod, ...p });
  const perMetre = mod.calcMethod !== "pillar";

  return (
    <ModuleCard
      title="Brick Pillars"
      zh="砖柱"
      enabled={mod.enabled}
      subtotal={lineSubtotal(mod)}
      onToggle={() => set({ enabled: !mod.enabled })}
      disabled={locked}
    >
      <div className="qq-row">
        <Field label="Calculation Method">
          <select
            disabled={off}
            value={perMetre ? "metre" : "pillar"}
            onChange={(e) => setMod(applyBrickPillarMethod(mod, e.target.value))}
          >
            <option value="metre">Per Metre 按米</option>
            <option value="pillar">Per Pillar 按数量</option>
          </select>
        </Field>
        {perMetre ? (
          <Field label="Length (m)">
            {numInput(off, mod.length, (v) => set({ length: v }))}
          </Field>
        ) : (
          <Field label="Qty (pillars)">
            {numInput(off, mod.quantity, (v) => set({ quantity: v }))}
          </Field>
        )}
        <PriceField
          line={mod}
          disabled={off}
          unit={perMetre ? "m" : "pillar"}
          onCustomPrice={(v) => set({ customPrice: v })}
        />
      </div>
      <AdvancedBlock
        open={mod.showAdvanced}
        forceOpen={false}
        disabled={off}
        onToggle={() => set({ showAdvanced: !mod.showAdvanced })}
      >
        <CustomExtras line={mod} set={set} disabled={off} />
      </AdvancedBlock>
    </ModuleCard>
  );
}

export function ColorbondModule({ mod, setMod, locked }) {
  const off = !mod.enabled || locked;
  const set = (p) => setMod({ ...mod, ...p });

  return (
    <ModuleCard
      title="Colorbond"
      zh="彩钢"
      enabled={mod.enabled}
      subtotal={lineSubtotal(mod)}
      onToggle={() => set({ enabled: !mod.enabled })}
      disabled={locked}
    >
      <div className="qq-row">
        <Field label="Length (m)">
          {numInput(off, mod.length, (v) => set({ length: v }), "e.g. 20")}
        </Field>
        <PriceField line={mod} disabled={off} unit="m" onCustomPrice={(v) => set({ customPrice: v })} />
      </div>
      <AdvancedBlock
        open={mod.showAdvanced}
        disabled={off}
        onToggle={() => set({ showAdvanced: !mod.showAdvanced })}
      >
        <CustomExtras line={mod} set={set} disabled={off} />
      </AdvancedBlock>
    </ModuleCard>
  );
}

export function PostsModule({ mod, setMod, locked }) {
  const off = !mod.enabled || locked;
  const set = (p) => setMod({ ...mod, ...p });
  const isCustom = mod.type === "custom";

  return (
    <ModuleCard
      title="Posts"
      zh="柱子"
      enabled={mod.enabled}
      subtotal={lineSubtotal(mod)}
      onToggle={() => set({ enabled: !mod.enabled })}
      disabled={locked}
    >
      <div className="qq-row">
        <Field label="Type">
          <select
            disabled={off}
            value={mod.type}
            onChange={(e) => setMod(applyCatalogDefaults(mod, pricingConfig.posts, e.target.value))}
          >
            {typeOptions(pricingConfig.posts, POST_TYPES)}
          </select>
        </Field>
        <Field label="Qty">
          {numInput(off, mod.quantity, (v) => set({ quantity: v }))}
        </Field>
        <PriceField line={mod} disabled={off} onCustomPrice={(v) => set({ customPrice: v })} />
      </div>
      <AdvancedBlock
        open={mod.showAdvanced}
        forceOpen={isCustom}
        disabled={off}
        onToggle={() => set({ showAdvanced: !mod.showAdvanced })}
      >
        <CustomExtras line={mod} set={set} disabled={off} descLabel="Custom Post Description" />
      </AdvancedBlock>
    </ModuleCard>
  );
}

function LineTable({ lines, parentOn, locked, onChange, customIds = ["custom"] }) {
  const off = !parentOn || locked;
  return (
    <div className="qq-lines">
      {lines.map((line, i) => {
        const lineOff = off || !line.enabled;
        const setLine = (p) => {
          const next = lines.slice();
          next[i] = { ...line, ...p };
          onChange(next);
        };
        return (
          <div key={line.id} className={`qq-line ${line.enabled && parentOn ? "" : "is-dim"}`}>
            <label className="qq-switch sm">
              <input
                type="checkbox"
                disabled={off}
                checked={!!line.enabled}
                onChange={() => setLine({ enabled: !line.enabled })}
              />
              <span>{line.name}<em>{line.nameZh}</em></span>
            </label>
            <Field label="Qty">
              {numInput(lineOff, line.quantity, (v) => setLine({ quantity: v }))}
            </Field>
            <PriceField line={line} disabled={lineOff} onCustomPrice={(v) => setLine({ customPrice: v })} />
            <div className="qq-line-sum">
              <span className="muted">Subtotal</span>
              <strong>{money(parentOn && line.enabled ? lineSubtotal(line) : 0)}</strong>
            </div>
            {(customIds.includes(line.id) || line.showAdvanced) && line.enabled && (
              <div className="qq-line-custom">
                <Field label="Custom Description" wide>
                  <input
                    disabled={lineOff}
                    value={line.customDescription || ""}
                    onChange={(e) => setLine({ customDescription: e.target.value })}
                  />
                </Field>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function InstallationModule({ mod, setMod, locked }) {
  return (
    <ModuleCard
      title="Installation"
      zh="安装"
      enabled={mod.enabled}
      subtotal={mod.enabled ? mod.lines.reduce((s, l) => s + (l.enabled ? lineSubtotal(l) : 0), 0) : 0}
      onToggle={() => setMod({ ...mod, enabled: !mod.enabled })}
      disabled={locked}
    >
      <LineTable
        lines={mod.lines}
        parentOn={mod.enabled}
        locked={locked}
        onChange={(lines) => setMod({ ...mod, lines })}
      />
    </ModuleCard>
  );
}

export function AccessoriesModule({ mod, setMod, locked }) {
  return (
    <ModuleCard
      title="Accessories"
      zh="配件"
      enabled={mod.enabled}
      subtotal={mod.enabled ? mod.lines.reduce((s, l) => s + (l.enabled ? lineSubtotal(l) : 0), 0) : 0}
      onToggle={() => setMod({ ...mod, enabled: !mod.enabled })}
      disabled={locked}
    >
      <LineTable
        lines={mod.lines}
        parentOn={mod.enabled}
        locked={locked}
        onChange={(lines) => setMod({ ...mod, lines })}
      />
    </ModuleCard>
  );
}

export function RetainingModule({ mod, setMod, locked }) {
  const off = !mod.enabled || locked;
  const set = (p) => setMod({ ...mod, ...p });
  const isCustom = mod.type === "custom";
  const byLength = (mod.customUnit || mod.unit) === "m";

  return (
    <ModuleCard
      title="Retaining / Board"
      zh="挡土 / 板"
      enabled={mod.enabled}
      subtotal={lineSubtotal(mod)}
      onToggle={() => set({ enabled: !mod.enabled })}
      disabled={locked}
    >
      <div className="qq-row">
        <Field label="Type">
          <select
            disabled={off}
            value={mod.type}
            onChange={(e) => {
              const next = applyCatalogDefaults(mod, pricingConfig.retaining, e.target.value);
              next.calcMethod = (next.unit === "m") ? "length" : "qty";
              setMod(next);
            }}
          >
            {typeOptions(pricingConfig.retaining, RETAINING_TYPES)}
          </select>
        </Field>
        {byLength ? (
          <Field label="Length (m)">
            {numInput(off, mod.length, (v) => set({ length: v, calcMethod: "length" }))}
          </Field>
        ) : (
          <Field label="Qty">
            {numInput(off, mod.quantity, (v) => set({ quantity: v, calcMethod: "qty" }))}
          </Field>
        )}
        <PriceField line={mod} disabled={off} onCustomPrice={(v) => set({ customPrice: v })} />
      </div>
      <AdvancedBlock
        open={mod.showAdvanced}
        forceOpen={isCustom}
        disabled={off}
        onToggle={() => set({ showAdvanced: !mod.showAdvanced })}
      >
        <CustomExtras line={mod} set={set} disabled={off} />
        <Field label="Custom Qty">
          {numInput(off, mod.quantity, (v) => set({ quantity: v, calcMethod: "qty" }))}
        </Field>
      </AdvancedBlock>
    </ModuleCard>
  );
}

export function RemovalModule({ mod, setMod, locked }) {
  const off = !mod.enabled || locked;
  const set = (p) => setMod({ ...mod, ...p });
  const isCustom = mod.type === "custom";
  const byLength = (mod.customUnit || mod.unit) === "m";

  return (
    <ModuleCard
      title="Removal / Rubbish"
      zh="拆除 / 清运"
      enabled={mod.enabled}
      subtotal={lineSubtotal(mod)}
      onToggle={() => set({ enabled: !mod.enabled })}
      disabled={locked}
    >
      <div className="qq-row">
        <Field label="Type">
          <select
            disabled={off}
            value={mod.type}
            onChange={(e) => {
              const next = applyCatalogDefaults(mod, pricingConfig.removal, e.target.value);
              next.calcMethod = next.unit === "m" ? "length" : "qty";
              setMod(next);
            }}
          >
            {typeOptions(pricingConfig.removal, REMOVAL_TYPES)}
          </select>
        </Field>
        {byLength ? (
          <Field label="Length / Qty (m)">
            {numInput(off, mod.length, (v) => set({ length: v, calcMethod: "length" }))}
          </Field>
        ) : (
          <Field label="Qty">
            {numInput(off, mod.quantity, (v) => set({ quantity: v, calcMethod: "qty" }))}
          </Field>
        )}
        <PriceField line={mod} disabled={off} onCustomPrice={(v) => set({ customPrice: v })} />
      </div>
      <AdvancedBlock
        open={mod.showAdvanced}
        forceOpen={isCustom}
        disabled={off}
        onToggle={() => set({ showAdvanced: !mod.showAdvanced })}
      >
        <CustomExtras line={mod} set={set} disabled={off} />
      </AdvancedBlock>
    </ModuleCard>
  );
}

export function OtherModule({ mod, setMod, locked }) {
  const off = !mod.enabled || locked;
  const set = (p) => setMod({ ...mod, ...p });

  return (
    <ModuleCard
      title="Other"
      zh="其他"
      enabled={mod.enabled}
      subtotal={lineSubtotal(mod)}
      onToggle={() => set({ enabled: !mod.enabled })}
      disabled={locked}
    >
      <div className="qq-row">
        <Field label="Description" wide>
          <input
            disabled={off}
            value={mod.customDescription}
            placeholder="Custom item"
            onChange={(e) => set({ customDescription: e.target.value })}
          />
        </Field>
        <Field label="Size">
          <input disabled={off} value={mod.customSize} onChange={(e) => set({ customSize: e.target.value })} />
        </Field>
        <Field label="Unit">
          <input disabled={off} value={mod.customUnit || mod.unit} onChange={(e) => set({ customUnit: e.target.value, unit: e.target.value })} />
        </Field>
        <Field label="Qty">
          {numInput(off, mod.quantity, (v) => set({ quantity: v }))}
        </Field>
        <PriceField line={mod} disabled={off} onCustomPrice={(v) => set({ customPrice: v })} />
      </div>
    </ModuleCard>
  );
}
