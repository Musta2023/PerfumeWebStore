import assert from "assert";

// Money helpers
const toCents = (n) => Math.round(Number(n || 0) * 100);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// Compute discounted amounts (all in cents) given authoritative product lines
// lines: [{ id, qty, unitAmountCents, family, productId }]
// coupon: mongoose doc or plain object from DB with fields { code, type, value, minSubtotal, restrictions, startsAt, endsAt, isActive }
// options: { taxRatePct?: number, shippingCents?: number, excludeProductIds?: string[] }
export function repriceCart(lines = [], coupon = null, options = {}) {
  const taxRatePct = Number(options.taxRatePct ?? 0); // e.g., 8.5 -> 8.5%
  const baseShippingCents = Math.max(0, Math.round(options.shippingCents ?? 0));
  const excludeIds = new Set(options.excludeProductIds || []);

  // Subtotal of discount-eligible items
  let subtotalCents = 0;
  let eligibleSubtotalCents = 0;

  const now = new Date();

  for (const l of lines) {
    const qty = Math.max(1, Math.floor(l.qty || 1));
    const unit = Math.max(0, Math.floor(l.unitAmountCents || 0));
    const lineTotal = unit * qty;
    subtotalCents += lineTotal;

    const excluded = excludeIds.has(String(l.productId || l.id));

    if (!coupon || excluded) continue;

    // Restriction filters
    let eligible = true;
    const r = coupon.restrictions || {};
    if (Array.isArray(r.productIds) && r.productIds.length > 0) {
      eligible = r.productIds.map(String).includes(String(l.productId || l.id));
    }
    if (eligible && Array.isArray(r.families) && r.families.length > 0) {
      eligible = r.families.includes(String(l.family));
    }

    if (eligible) eligibleSubtotalCents += lineTotal;
  }

  // Default: free shipping false
  let shippingCents = baseShippingCents;

  // Compute discount
  let discountCents = 0;
  let validCoupon = false;
  let reason = "";

  if (coupon) {
    // sanity checks
    const starts = coupon.startsAt ? new Date(coupon.startsAt) : null;
    const ends = coupon.endsAt ? new Date(coupon.endsAt) : null;
    if (!coupon.isActive) {
      reason = "Coupon inactive";
    } else if (starts && now < starts) {
      reason = "Coupon not started yet";
    } else if (ends && now > ends) {
      reason = "Coupon expired";
    } else {
      const minSub = Math.max(0, Math.floor(coupon.minSubtotal || 0));
      const baseForDiscount = eligibleSubtotalCents > 0 ? eligibleSubtotalCents : subtotalCents;
      if (baseForDiscount < minSub) {
        reason = "Minimum subtotal not met";
      } else {
        const t = coupon.type;
        if (t === "percent") {
          const pct = clamp(Math.round(Number(coupon.value || 0)), 0, 100);
          discountCents = Math.floor((baseForDiscount * pct) / 100);
          validCoupon = discountCents > 0;
        } else if (t === "fixed") {
          const amount = Math.max(0, Math.floor(coupon.value || 0));
          discountCents = Math.min(amount, baseForDiscount);
          validCoupon = discountCents > 0;
        } else if (t === "shipping") {
          // shipping discount applied after product discounts -> set shipping to 0
          shippingCents = 0;
          validCoupon = true;
        }
      }
    }
  }

  // Tax on discounted subtotal (before shipping)
  const taxableSubtotal = Math.max(0, subtotalCents - discountCents);
  const taxCents = Math.round((taxableSubtotal * taxRatePct) / 100);

  const totalCents = Math.max(0, taxableSubtotal + taxCents + shippingCents);

  return {
    subtotalCents,
    eligibleSubtotalCents,
    discountCents,
    taxCents,
    shippingCents,
    totalCents,
    valid: coupon ? !!validCoupon : true,
    reason: coupon && !validCoupon ? reason || "Ineligible" : undefined,
    applied:
      coupon && validCoupon
        ? {
            code: String(coupon.code).toUpperCase(),
            type: coupon.type,
            amountAppliedCents: discountCents || (coupon.type === "shipping" ? baseShippingCents : 0),
            value: coupon.value,
          }
        : null,
  };
}

export default repriceCart;
