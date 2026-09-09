import {
  pricingConfig,
  INSTALL_TYPES,
  ACCESSORY_TYPES,
} from "../data/pricingConfig.js";
import { computeTotals, effectivePrice, lineSubtotal, toQuoteItem } from "./quoteMath.js";

export function newQuoteId(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const t = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `QQ-${y}${m}${d}-${t}${r}`;
}

export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function baseLine(overrides = {}) {
  return {
    enabled: true,
    type: "",
    calcMethod: "qty",
    length: "",
    quantity: "",
    size: "",
    width: "",
    height: "",
    unit: "ea",
    defaultPrice: 0,
    customPrice: null,
    customDescription: "",
    customSize: "",
    customUnit: "",
    showAdvanced: false,
    ...overrides,
  };
}

function installLines() {
  return INSTALL_TYPES.map((id) => {
    const cfg = pricingConfig.installation[id];
    return {
      id,
      name: cfg.name,
      nameZh: cfg.nameZh,
      enabled: false,
      quantity: "",
      unit: cfg.unit,
      defaultPrice: cfg.defaultPrice,
      customPrice: null,
      customDescription: "",
      showAdvanced: id === "custom",
    };
  });
}

function accessoryLines() {
  return ACCESSORY_TYPES.map((id) => {
    const cfg = pricingConfig.accessories[id];
    return {
      id,
      name: cfg.name,
      nameZh: cfg.nameZh,
      enabled: false,
      quantity: "",
      unit: cfg.unit,
      defaultPrice: cfg.defaultPrice,
      customPrice: null,
      customDescription: "",
      showAdvanced: id === "custom",
    };
  });
}

export function createEmptyQuote() {
  const fence = pricingConfig.fence.horizontal;
  const pGate = pricingConfig.pedestrianGate.horizontal;
  const sGate = pricingConfig.slidingGate.horizontal;
  const motor = pricingConfig.motor.standard;
  const post = pricingConfig.posts["65x65"];
  const retain = pricingConfig.retaining.board;
  const removal = pricingConfig.removal.oldFence;

  return {
    quoteId: newQuoteId(),
    customerName: "",
    date: todayISO(),
    status: "draft",
    discount: "",
    adjustment: "",
    modules: {
      fence: baseLine({
        enabled: false,
        type: "horizontal",
        calcMethod: "length",
        unit: fence.unit,
        size: fence.defaultSize,
        defaultPrice: fence.defaultPrice,
      }),
      pedestrianGate: baseLine({
        enabled: false,
        type: "horizontal",
        calcMethod: "qty",
        quantity: "1",
        unit: pGate.unit,
        size: pGate.defaultSize,
        defaultPrice: pGate.defaultPrice,
      }),
      slidingGate: baseLine({
        enabled: false,
        type: "horizontal",
        calcMethod: "qty",
        quantity: "1",
        width: "5",
        height: "1.8",
        unit: sGate.unit,
        defaultPrice: sGate.defaultPrice,
      }),
      motor: baseLine({
        enabled: false,
        type: "standard",
        calcMethod: "qty",
        quantity: "1",
        unit: motor.unit,
        defaultPrice: motor.defaultPrice,
      }),
      brickWall: baseLine({
        enabled: false,
        calcMethod: "metre",
        unit: pricingConfig.brickWall.unit,
        defaultPrice: pricingConfig.brickWall.defaultPerMetre,
      }),
      brickPillars: baseLine({
        enabled: false,
        calcMethod: "metre",
        unit: pricingConfig.brickPillars.unitMetre,
        defaultPrice: pricingConfig.brickPillars.defaultPerMetre,
      }),
      colorbond: baseLine({
        enabled: false,
        calcMethod: "metre",
        unit: pricingConfig.colorbond.unit,
        defaultPrice: pricingConfig.colorbond.defaultPerMetre,
      }),
      posts: baseLine({
        enabled: false,
        type: "65x65",
        calcMethod: "qty",
        unit: post.unit,
        defaultPrice: post.defaultPrice,
      }),
      installation: {
        enabled: false,
        lines: installLines(),
      },
      accessories: {
        enabled: false,
        lines: accessoryLines(),
      },
      retaining: baseLine({
        enabled: false,
        type: "board",
        calcMethod: "length",
        unit: retain.unit,
        defaultPrice: retain.defaultPrice,
      }),
      removal: baseLine({
        enabled: false,
        type: "oldFence",
        calcMethod: "length",
        unit: removal.unit,
        defaultPrice: removal.defaultPrice,
      }),
      other: baseLine({
        enabled: false,
        type: "custom",
        calcMethod: "qty",
        quantity: "1",
        unit: "ea",
        defaultPrice: pricingConfig.other.custom.defaultPrice,
        showAdvanced: true,
      }),
    },
  };
}

export function applyCatalogDefaults(line, catalog, typeKey, extra = {}) {
  const cfg = catalog[typeKey] || catalog.custom;
  const next = {
    ...line,
    type: typeKey,
    defaultPrice: cfg.defaultPrice,
    customPrice: null,
    unit: line.customUnit || cfg.unit || line.unit,
    showAdvanced: typeKey === "custom" ? true : line.showAdvanced,
    ...extra,
  };
  if (cfg.defaultSize !== undefined) next.size = cfg.defaultSize;
  return next;
}

export function applyFenceType(line, type, calcMethod = line.calcMethod) {
  const cfg = pricingConfig.fence[type] || pricingConfig.fence.custom;
  const price = calcMethod === "panel" ? cfg.panelPrice : cfg.defaultPrice;
  return {
    ...line,
    type,
    calcMethod,
    defaultPrice: price,
    customPrice: null,
    unit: calcMethod === "panel" ? "panel" : cfg.unit,
    size: cfg.defaultSize,
    showAdvanced: type === "custom" ? true : line.showAdvanced,
  };
}

export function applyBrickPillarMethod(line, method) {
  const cfg = pricingConfig.brickPillars;
  const perMetre = method === "metre";
  return {
    ...line,
    calcMethod: method,
    unit: perMetre ? cfg.unitMetre : cfg.unitPillar,
    defaultPrice: perMetre ? cfg.defaultPerMetre : cfg.defaultPerPillar,
    customPrice: null,
  };
}

function linesTotal(mod) {
  if (!mod.enabled) return 0;
  return (mod.lines || []).reduce((s, line) => s + (mod.enabled && line.enabled ? lineSubtotal(line) : 0), 0);
}

function singleTotal(mod) {
  if (!mod?.enabled) return 0;
  return lineSubtotal({ ...mod, enabled: true });
}

export function moduleSubtotals(modules) {
  return {
    fence: singleTotal(modules.fence),
    pedestrianGate: singleTotal(modules.pedestrianGate),
    slidingGate: singleTotal(modules.slidingGate),
    motor: singleTotal(modules.motor),
    brickWall: singleTotal(modules.brickWall),
    brickPillars: singleTotal(modules.brickPillars),
    colorbond: singleTotal(modules.colorbond),
    posts: singleTotal(modules.posts),
    installation: linesTotal(modules.installation),
    accessories: linesTotal(modules.accessories),
    retaining: singleTotal(modules.retaining),
    removal: singleTotal(modules.removal),
    other: singleTotal(modules.other),
  };
}

export function summarizeQuote(quote) {
  const subs = moduleSubtotals(quote.modules);
  const totals = computeTotals(subs, {
    gstRate: pricingConfig.gstRate,
    discount: quote.discount,
    adjustment: quote.adjustment,
  });
  return { ...totals, modules: subs, items: collectItems(quote) };
}

export function collectItems(quote) {
  const m = quote.modules;
  const items = [];
  const push = (mod, category, name, extra = {}) => {
    if (!mod) return;
    items.push(toQuoteItem({ ...mod, category, name, enabled: !!mod.enabled && quote.modules[category]?.enabled !== false }, extra));
  };

  push(m.fence, "fence", m.fence.customDescription || labelType("fence", m.fence.type), {
    size: m.fence.customSize || m.fence.size,
  });
  push(m.pedestrianGate, "pedestrianGate", m.pedestrianGate.customDescription || `Pedestrian Gate ${labelType("pedestrianGate", m.pedestrianGate.type)}`);
  push(m.slidingGate, "slidingGate", m.slidingGate.customDescription || `Sliding Gate ${labelType("slidingGate", m.slidingGate.type)}`, {
    size: `${m.slidingGate.width || "?"}m × ${m.slidingGate.height || "?"}m`,
  });
  push(m.motor, "motor", m.motor.customDescription || `Motor ${labelType("motor", m.motor.type)}`);
  push(m.brickWall, "brickWall", "Brick Wall");
  push(m.brickPillars, "brickPillars", "Brick Pillars");
  push(m.colorbond, "colorbond", "Colorbond");
  push(m.posts, "posts", m.posts.customDescription || `Posts ${labelType("posts", m.posts.type)}`);

  if (m.installation) {
    m.installation.lines.forEach((line) => {
      items.push(toQuoteItem({
        ...line,
        category: "installation",
        name: line.customDescription || line.name,
        enabled: !!(m.installation.enabled && line.enabled),
      }));
    });
  }
  if (m.accessories) {
    m.accessories.lines.forEach((line) => {
      items.push(toQuoteItem({
        ...line,
        category: "accessories",
        name: line.customDescription || line.name,
        enabled: !!(m.accessories.enabled && line.enabled),
      }));
    });
  }

  push(m.retaining, "retaining", m.retaining.customDescription || labelType("retaining", m.retaining.type));
  push(m.removal, "removal", m.removal.customDescription || labelType("removal", m.removal.type));
  push(m.other, "other", m.other.customDescription || "Other");
  return items;
}

const NAME_MAP = {
  fence: pricingConfig.fence,
  pedestrianGate: pricingConfig.pedestrianGate,
  slidingGate: pricingConfig.slidingGate,
  motor: pricingConfig.motor,
  posts: pricingConfig.posts,
  retaining: pricingConfig.retaining,
  removal: pricingConfig.removal,
};

export function labelType(category, type) {
  const cfg = NAME_MAP[category]?.[type];
  return cfg?.name || type || "";
}

export function fenceTypeLabel(quote) {
  const f = quote.modules?.fence;
  if (f?.enabled) {
    if (f.type === "custom" && f.customDescription) return f.customDescription;
    return labelType("fence", f.type) || "Fence";
  }
  return "—";
}

export function hydrateQuote(raw) {
  const base = createEmptyQuote();
  if (!raw || typeof raw !== "object") return base;
  const modules = { ...base.modules };
  for (const key of Object.keys(base.modules)) {
    const incoming = raw.modules?.[key];
    if (!incoming) continue;
    if (Array.isArray(base.modules[key].lines)) {
      const byId = new Map((incoming.lines || []).map((l) => [l.id, l]));
      modules[key] = {
        ...base.modules[key],
        ...incoming,
        lines: base.modules[key].lines.map((line) => ({ ...line, ...(byId.get(line.id) || {}) })),
      };
    } else {
      modules[key] = { ...base.modules[key], ...incoming };
    }
  }
  return {
    ...base,
    ...raw,
    quoteId: raw.quoteId || base.quoteId,
    date: raw.date || base.date,
    modules,
  };
}

export function duplicateQuote(quote) {
  const copy = hydrateQuote(structuredClone(quote));
  copy.quoteId = newQuoteId();
  copy.date = todayISO();
  copy.status = "draft";
  return copy;
}

export function effectiveOf(mod) {
  return effectivePrice(mod);
}
