/** Fuzzy name match — case/space insensitive, substring or sequential chars */
export function fuzzyMatch(haystack, needle) {
  const q = String(needle || "").trim().toLowerCase();
  if (!q) return true;
  const text = String(haystack || "").toLowerCase();
  if (!text) return false;
  if (text.includes(q)) return true;
  const compact = text.replace(/\s+/g, "");
  const qCompact = q.replace(/\s+/g, "");
  if (compact.includes(qCompact)) return true;
  // sequential character match (e.g. "wm" → "王先生" won't work for CJK;
  // for latin: "sar" → "Sarah")
  let i = 0;
  for (const ch of compact) {
    if (ch === qCompact[i]) i += 1;
    if (i >= qCompact.length) return true;
  }
  // Chinese: also match if every char of query appears somewhere in order
  i = 0;
  for (const ch of text) {
    if (ch === q[i]) i += 1;
    if (i >= q.length) return true;
  }
  return false;
}

export function fuzzyCustomer(c, query) {
  const q = String(query || "").trim();
  if (!q) return true;
  return (
    fuzzyMatch(c.name, q) ||
    fuzzyMatch(c.phone, q) ||
    fuzzyMatch(c.email, q) ||
    fuzzyMatch(c.suburb, q)
  );
}
