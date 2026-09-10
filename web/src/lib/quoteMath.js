/** Price + line math. Always use effectivePrice for totals. */

export function hasCustomPrice(customPrice) {
  return customPrice !== null && customPrice !== undefined && customPrice !== "";
}

export function effectivePrice(item) {
  if (hasCustomPrice(item?.customPrice)) {
    const n = Number(item.customPrice);
    return Number.isFinite(n) ? n : Number(item?.defaultPrice) || 0;
  }
  return Number(item?.defaultPrice) || 0;
}

export function measureQty(item) {
  const method = item?.calcMethod;
  if (method === "length" || method === "metre") return Number(item.length) || 0;
  if (method === "qty" || method === "pillar" || method === "panel") return Number(item.quantity) || 0;
  if (item?.unit === "m" && item.length !== undefined && item.length !== "") {
    return Number(item.length) || 0;
  }
  if (item?.quantity !== undefined && item.quantity !== "") return Number(item.quantity) || 0;
  if (item?.length !== undefined && item.length !== "") return Number(item.length) || 0;
  return 0;
}

export function lineSubtotal(item) {
  if (item && item.enabled === false) return 0;
  return roundMoney(measureQty(item) * effectivePrice(item));
}

export function roundMoney(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function money(n) {
  return (Number(n) || 0).toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

export function computeTotals(moduleSubtotals, { gstRate = 0.1, discount = 0, adjustment = 0 } = {}) {
  const subtotal = roundMoney(Object.values(moduleSubtotals).reduce((s, v) => s + (Number(v) || 0), 0));
  const gst = roundMoney(subtotal * Number(gstRate));
  const disc = Number(discount) || 0;
  const adj = Number(adjustment) || 0;
  const total = roundMoney(subtotal + gst - disc + adj);
  return { subtotal, gst, discount: disc, adjustment: adj, total };
}

export function toQuoteItem(item, extras = {}) {
  const price = effectivePrice(item);
  const qty = measureQty(item);
  return {
    id: item.id || extras.id || "",
    category: item.category || extras.category || "",
    name: item.name || extras.name || "",
    size: item.size || item.customSize || extras.size || "",
    unit: item.customUnit || item.unit || extras.unit || "",
    defaultPrice: Number(item.defaultPrice) || 0,
    customPrice: hasCustomPrice(item.customPrice) ? Number(item.customPrice) : null,
    effectivePrice: price,
    quantity: qty,
    subtotal: item.enabled === false ? 0 : roundMoney(qty * price),
    enabled: item.enabled !== false,
  };
}
