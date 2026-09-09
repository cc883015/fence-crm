import assert from "node:assert/strict";
import { computeTotals, effectivePrice, lineSubtotal } from "./quoteMath.js";
import { pricingConfig } from "../data/pricingConfig.js";
import {
  applyBrickPillarMethod,
  applyFenceType,
  createEmptyQuote,
  moduleSubtotals,
  summarizeQuote,
} from "./quoteModel.js";

const fenceDefault = pricingConfig.fence.horizontal.defaultPrice;
assert.equal(fenceDefault, 399);
assert.equal(pricingConfig.brickWall.defaultPerMetre, 1200);
assert.equal(pricingConfig.brickPillars.defaultPerMetre, 700);
assert.equal(pricingConfig.colorbond.defaultPerMetre, 160);

assert.equal(effectivePrice({ defaultPrice: 399, customPrice: null }), 399);
assert.equal(effectivePrice({ defaultPrice: 399, customPrice: "" }), 399);
assert.equal(effectivePrice({ defaultPrice: 399, customPrice: 380 }), 380);
assert.equal(effectivePrice({ defaultPrice: 399, customPrice: "380" }), 380);

assert.equal(lineSubtotal({ enabled: true, calcMethod: "length", length: 18, defaultPrice: 330, customPrice: null }), 5940);
assert.equal(lineSubtotal({ enabled: true, calcMethod: "qty", quantity: 5, defaultPrice: 0, customPrice: 520 }), 2600);
assert.equal(lineSubtotal({ enabled: false, calcMethod: "length", length: 10, defaultPrice: 1200 }), 0);

const q = createEmptyQuote();
assert.equal(q.modules.brickWall.defaultPrice, pricingConfig.brickWall.defaultPerMetre);
assert.equal(q.modules.brickPillars.defaultPrice, pricingConfig.brickPillars.defaultPerMetre);
assert.equal(q.modules.colorbond.defaultPrice, pricingConfig.colorbond.defaultPerMetre);
assert.equal(q.modules.fence.defaultPrice, pricingConfig.fence.horizontal.defaultPrice);

q.modules.fence.enabled = true;
q.modules.fence.length = "18";
q.modules.fence.customPrice = "330";
assert.equal(moduleSubtotals(q.modules).fence, 5940);

q.modules.brickWall.enabled = true;
q.modules.brickWall.length = "10";
assert.equal(moduleSubtotals(q.modules).brickWall, 12000);
q.modules.brickWall.customPrice = "1100";
assert.equal(moduleSubtotals(q.modules).brickWall, 11000);

q.modules.colorbond.enabled = true;
q.modules.colorbond.length = "20";
assert.equal(moduleSubtotals(q.modules).colorbond, 3200);

q.modules.brickPillars.enabled = true;
q.modules.brickPillars.length = "6";
assert.equal(moduleSubtotals(q.modules).brickPillars, 4200);
const perPillar = applyBrickPillarMethod(q.modules.brickPillars, "pillar");
assert.equal(perPillar.defaultPrice, pricingConfig.brickPillars.defaultPerPillar);
assert.equal(perPillar.customPrice, null);

const waved = applyFenceType(q.modules.fence, "wave", "length");
assert.equal(waved.defaultPrice, pricingConfig.fence.wave.defaultPrice);
assert.equal(waved.customPrice, null);

q.modules.fence.enabled = false;
assert.equal(moduleSubtotals(q.modules).fence, 0);

const totals = summarizeQuote(q);
assert.equal(totals.gst, Math.round(totals.subtotal * pricingConfig.gstRate * 100) / 100);
const withDisc = computeTotals({ a: 1000 }, { gstRate: 0.1, discount: 50, adjustment: 20 });
assert.equal(withDisc.subtotal, 1000);
assert.equal(withDisc.gst, 100);
assert.equal(withDisc.total, 1070);

console.log("quote math + model tests passed");
