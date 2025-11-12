import Coupon from "../models/couponModel.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js"; // <-- add your product model
import User from "../models/userModel.js";
import { stripe } from "../lib/stripe.js";
import crypto from "crypto";
import { repriceCart } from "../lib/cartPricing.js";

const CURRENCY = (process.env.CURRENCY || "usd").toLowerCase();
const CLIENT_URL = process.env.CLIENT_URL;

// ---- utils/helpers ----
const toCents = (n) => Math.round(Number(n) * 100);
const isPosInt = (x) => Number.isInteger(x) && x > 0;

async function getProductsByIds(ids) {
  // fetch authoritative product data from DB
  const docs = await Product.find({ _id: { $in: ids }, isActive: true })
    .select("_id name price image category") // price in major units (e.g., 12.34)
    .lean();
  return new Map(docs.map((d) => [String(d._id), d]));
}

async function getRequestedFromUserCart(userId) {
  const user = await User.findById(userId).lean();
  const items = (user?.cartItems || []).map((i) => ({
    id: String(i.productId),
    quantity: Number(i.quantity || 1),
  })).filter((x) => x.id && isPosInt(x.quantity));
  return items;
}
// Create Stripe coupon for percent-off
async function createStripePercentCoupon(discountPercentage) {
  const pct = Math.max(0, Math.min(100, Math.round(discountPercentage)));
  const coupon = await stripe.coupons.create({ percent_off: pct, duration: "once" });
  return coupon.id;
}
// Create Stripe coupon for fixed amount off (in cents)
async function createStripeFixedCoupon(amountOffCents, currency) {
  const amt = Math.max(0, Math.floor(amountOffCents || 0));
  const coupon = await stripe.coupons.create({ amount_off: amt, currency, duration: "once" });
  return coupon.id;
}

async function createNewCoupon(userId) {
  // Loyalty: ensure one coupon per user by upserting on userId
  // Try a few times in case the random code collides with existing unique code
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = "GIFT" + crypto.randomBytes(3).toString("hex").toUpperCase();
    try {
      const doc = await Coupon.findOneAndUpdate(
        { userId },
        {
          $setOnInsert: {
            code,
            type: "percent",
            value: 10,
            startsAt: new Date(),
            endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            userId,
            isActive: true,
          },
          $set: { updatedAt: new Date() },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return doc;
    } catch (err) {
      if (err?.code === 11000) {
        // Likely code uniqueness collision; retry with a new code
        continue;
      }
      throw err;
    }
  }
  // Fallback: fetch existing if present
  const existing = await Coupon.findOne({ userId });
  if (existing) return existing;
  throw new Error("Failed to create or retrieve reward coupon after retries");
}

// ================= CREATE CHECKOUT SESSION =================
export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode, delivery } = req.body || {};

    if (!CLIENT_URL) {
      return res.status(500).json({ message: "Server misconfigured: CLIENT_URL missing", error: "CLIENT_URL missing" });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: "Server misconfigured: STRIPE_SECRET_KEY missing", error: "STRIPE_SECRET_KEY missing" });
    }

    // Validate delivery info (required for shipping)
    const name = (delivery?.name || "").trim();
    const address = (delivery?.address || "").trim();
    const phone = (delivery?.phone || "").trim();
    if (!name || !address || !phone) {
      return res.status(400).json({ error: "Delivery info required: name, address, phone" });
    }

    // Build requested list from body or fall back to the user's server-side cart
    let requested = [];
    if (Array.isArray(products) && products.length > 0) {
      for (const product of products) {
        const id = String(product._id || product.id || "");
        const qty = Number(product.quantity || 1);
        if (!id || !isPosInt(qty)) {
          return res.status(400).json({ error: "Invalid product data" });
        }
        requested.push({ id, quantity: qty });
      }
    } else {
      requested = await getRequestedFromUserCart(req.userId);
      if (!requested.length) {
        return res.status(400).json({ error: "Cart is empty" });
      }
    }

    // Fetch products from DB to verify prices and details (authoritative source)
    const productMap = await getProductsByIds(requested.map((r) => r.id));

    // Build Stripe line_items using server prices only
    const line_items = [];
    let serverTotalCents = 0;

    for (const { id, quantity } of requested) {
      const dbp = productMap.get(id);
      if (!dbp) {
        // skip unavailable/inactive items
        continue;
      }
      const unitAmount = toCents(dbp.price);
      if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
        // skip nonsellable pricing
        continue;
      }
      serverTotalCents += unitAmount * quantity;

      const product_data = {
        name: dbp.name,
        metadata: { productId: id },
      };
      // Only include image if it's a public HTTPS URL
      if (dbp.image && /^https:\/\//i.test(dbp.image)) {
        product_data.images = [dbp.image];
      }

      line_items.push({
        price_data: {
          currency: CURRENCY,
          product_data,
          unit_amount: unitAmount,
        },
        quantity,
      });
    }

    // Optional: validate coupon and compute discount server-side
    let discounts = [];
    let appliedCouponCode = "";
    let appliedSnapshot = null;
    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      const code = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOne({ code, isActive: true }).lean();
      if (!coupon) {
        return res.status(400).json({ error: "Invalid or expired coupon code" });
      }

      // Build pricing lines for discount calculation (based on server prices)
      const pricingLines = requested.map(({ id, quantity }) => {
        const p = productMap.get(id);
        return {
          id,
          productId: id,
          qty: quantity,
          unitAmountCents: toCents(p.price),
          family: p.category,
        };
      });

      const pricing = repriceCart(pricingLines, coupon, { taxRatePct: 0, shippingCents: 0 });
      if (!pricing.valid) {
        return res.status(400).json({ error: pricing.reason || "Coupon ineligible" });
      }

      // Create a temporary Stripe coupon to match the computed discount.
      if (coupon.type === "percent") {
        const stripeCouponId = await createStripePercentCoupon(Math.round(coupon.value));
        discounts = [{ coupon: stripeCouponId }];
      } else if (coupon.type === "fixed") {
        const stripeCouponId = await createStripeFixedCoupon(pricing.discountCents, CURRENCY);
        discounts = [{ coupon: stripeCouponId }];
      } else if (coupon.type === "shipping") {
        // No shipping setup here; proceed without Stripe discount, amounts remain same as no shipping charged.
      }

      appliedCouponCode = code;
      appliedSnapshot = {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        amountAppliedCents: pricing.discountCents,
      };
    }

    // Create Stripe session (with idempotency to avoid duplicates)
    const idempotencyKey = crypto.randomUUID();
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items,
        success_url: `${CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${CLIENT_URL}/purchase-cancel`,
        discounts,
        
        metadata: {
          userId: String(req.user._id),
          couponCode: appliedCouponCode,
          couponSnapshot: appliedSnapshot ? JSON.stringify(appliedSnapshot) : "",
          // Store only IDs & quantities (no prices)
          products: JSON.stringify(requested),
          serverTotalCents: String(serverTotalCents), // for reconciliation (not authoritative)
          deliveryName: name,
          deliveryAddress: address,
          deliveryPhone: phone,
        },
      },
      { idempotencyKey }
    );

    // Optional loyalty example (don’t mutate charge amount here)
    if (serverTotalCents >= 20000) {
      await createNewCoupon(req.user._id);
    }

    // If you want to show an estimated total, compute it from serverTotalCents
    // and the coupon percentage (display only).
    let estimatedTotal = serverTotalCents;
    if (discounts.length > 0) {
      // If you got the coupon doc, you could have percent off here—display only.
      // Keep it simple: the real charged amount is session.amount_total after checkout.
    }

    if (line_items.length === 0) {
      return res.status(400).json({ error: "No sellable items" });
    }

    return res.status(200).json({
      id: session.id,
      url: session.url, // handy for client redirect
      currency: CURRENCY,
      // optional display hint
      estimatedTotal: Math.round(estimatedTotal) / 100,
    });
  } catch (error) {
    console.error("Error processing checkout:", error);
    return res.status(500).json({ message: error?.message || "Error processing checkout", error: "checkout_failed" });
  }
};

// ================= CHECKOUT SUCCESS (UI helper; prefer webhook) =================
export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const isPaid =
      session.payment_status === "paid" ||
      (session.status === "complete" && session.mode === "payment");

    if (!isPaid) {
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }

    // Idempotency: avoid duplicate orders
    const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Order already processed",
        orderId: existingOrder._id,
      });
    }

    // Update coupon usage (idempotent best-effort)
    const couponCode = (session.metadata?.couponCode || "").trim();
    const couponSnapshotStr = session.metadata?.couponSnapshot || "";
    let couponSnapshot = null;
    try { couponSnapshot = couponSnapshotStr ? JSON.parse(couponSnapshotStr) : null; } catch {}
    if (couponCode) {
      // Increment global counter
      await Coupon.updateOne(
        { code: couponCode },
        { $inc: { usedCount: 1 }, $set: { updatedAt: new Date() }, $setOnInsert: { isActive: true } }
      );
      // Increment per-customer counter
      await Coupon.updateOne(
        { code: couponCode, "usedBy.userId": { $ne: session.metadata?.userId } },
        { $push: { usedBy: { userId: session.metadata?.userId, count: 1, lastUsedAt: new Date() } } }
      );
      await Coupon.updateOne(
        { code: couponCode, "usedBy.userId": session.metadata?.userId },
        { $inc: { "usedBy.$.count": 1 }, $set: { "usedBy.$.lastUsedAt": new Date() } }
      );
    }

    // Reconstruct order items from product IDs & quantities, not client prices
    const items = JSON.parse(session.metadata?.products || "[]"); // [{id, quantity}]
    const productMap = await getProductsByIds(items.map((i) => String(i.id)));

    const orderProducts = [];
    for (const it of items) {
      const dbp = productMap.get(String(it.id));
      if (!dbp) continue;
      orderProducts.push({
        product: dbp._id,
        quantity: it.quantity,
        price: dbp.price, // store major units from DB
      });
    }

    // Source of truth for total charged
    const totalAmount = (session.amount_total ?? 0) / 100;

    // Derive subtotal (display) and discount from metadata if present
    const serverSubtotal = Number(session.metadata?.serverTotalCents || 0) / 100;
    const discountTotal = couponSnapshot?.amountAppliedCents ? (couponSnapshot.amountAppliedCents / 100) : 0;

    const newOrder = new Order({
      user: session.metadata?.userId,
      products: orderProducts,
      // delivery info propagated from session metadata
      deliveryName: session.metadata?.deliveryName || "",
      deliveryAddress: session.metadata?.deliveryAddress || "",
      deliveryPhone: session.metadata?.deliveryPhone || "",
      totalAmount,
      currency: (session.currency || CURRENCY).toLowerCase(),
      stripeSessionId: sessionId,
      status: "paid",
      discountTotal,
      couponCode: couponCode || null,
      couponSnapshot: couponSnapshot || null,
      amounts: {
        subtotal: serverSubtotal,
        tax: 0,
        shipping: 0,
        total: totalAmount,
      },
    });

    await newOrder.save();

    // Optional reward coupon
    let reward = null;
    if ((session.amount_total ?? 0) >= 20000) {
      reward = await createNewCoupon(session.metadata?.userId);
    }

    return res.status(200).json({
      success: true,
      message: "Payment successful, order created.",
      orderId: newOrder._id,
      ...(reward && {
        newCoupon: {
          code: reward.code,
          discountPercentage: reward.value,
          expirationDate: reward.endsAt,
        },
      }),
    });
  } catch (error) {
    console.error("Error processing successful checkout:", error);
    return res.status(500).json({ message: "Error processing successful checkout", error: error.message });
  }
};
