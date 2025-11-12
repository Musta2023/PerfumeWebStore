import Coupon from "../models/couponModel.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import { repriceCart } from "../lib/cartPricing.js";

const toCents = (n) => Math.round(Number(n || 0) * 100);
const fromCents = (c) => (Number(c || 0) / 100);

// Build pricing lines from the current user's cart
async function buildCartLines(userId) {
	const user = await User.findById(userId).lean();
	if (!user) throw new Error("User not found");
	const items = (user.cartItems || []).map((i) => ({
		productId: String(i.productId),
		qty: Number(i.quantity || 1),
	}));
	if (items.length === 0) return { lines: [], products: new Map() };
	const productDocs = await Product.find({ _id: { $in: items.map((i) => i.productId) }, isActive: true })
		.select("_id name price image category")
		.lean();
	const productMap = new Map(productDocs.map((d) => [String(d._id), d]));
	const lines = items
		.filter((it) => productMap.has(it.productId))
		.map((it) => {
			const p = productMap.get(it.productId);
			return {
				id: it.productId,
				productId: it.productId,
				qty: Math.max(1, Math.floor(it.qty)),
				unitAmountCents: toCents(p.price),
				family: p.category,
				name: p.name,
				image: p.image,
			};
		});
	return { lines, products: productMap };
}

// GET /api/coupons - Returns a user-assigned coupon if any; otherwise, on first purchase,
// returns the best applicable first-order coupon (if available) based on the current cart.
export const getCoupon = async (req, res) => {
	try {
		const userId = req.userId;

		// Load current cart context for preview/eligibility checks
		const { lines } = await buildCartLines(userId);

		// 1) Prefer any active coupon specifically assigned to the user (loyalty rewards)
		let selected = await Coupon.findOne({ userId, isActive: true }).lean();
		if (selected) {
			// Validate basic first-order restriction and usage limits similar to validateCoupon
			if (selected?.restrictions?.firstOrderOnly) {
				const hasPaid = await Order.exists({ user: userId, status: { $in: ["paid", "processing", "shipped", "delivered"] } });
				if (hasPaid) return res.json(null);
			}
			if (typeof selected.usageLimitTotal === "number" && selected.usageLimitTotal > 0 && Number(selected.usedCount || 0) >= selected.usageLimitTotal) {
				return res.json(null);
			}
			if (typeof selected.usageLimitPerCustomer === "number" && selected.usageLimitPerCustomer > 0) {
				const usedBy = (selected.usedBy || []).find((u) => String(u.userId) === String(userId));
				if (usedBy && usedBy.count >= selected.usageLimitPerCustomer) {
					return res.json(null);
				}
			}

			// If there are items in cart, ensure it is applicable
			if (lines.length > 0) {
				const pricing = repriceCart(lines, selected, { taxRatePct: 0, shippingCents: 0 });
				if (!pricing.valid) return res.json(null);
			}
			return res.json({ code: selected.code, type: selected.type, value: selected.value });
		}

		// 2) If no user-specific coupon, and this is the customer's first order, try a first-order coupon
		const hasPaid = await Order.exists({ user: userId, status: { $in: ["paid", "processing", "shipped", "delivered"] } });
		if (hasPaid) return res.json(null);

		// Find active global coupons restricted to first order
		const candidates = await Coupon.find({ isActive: true, "restrictions.firstOrderOnly": true }).lean();
		if (!candidates || candidates.length === 0) return res.json(null);

		let best = null;
		let bestDiscountCents = -1;

		for (const c of candidates) {
			// Skip exhausted coupons
			if (typeof c.usageLimitTotal === "number" && c.usageLimitTotal > 0 && Number(c.usedCount || 0) >= c.usageLimitTotal) continue;
			if (typeof c.usageLimitPerCustomer === "number" && c.usageLimitPerCustomer > 0) {
				const usedBy = (c.usedBy || []).find((u) => String(u.userId) === String(userId));
				if (usedBy && usedBy.count >= c.usageLimitPerCustomer) continue;
			}

			if (lines.length === 0) {
				// No items yet: we cannot compute preview; just pick the first viable candidate
				best = best || c;
				continue;
			}

			const pricing = repriceCart(lines, c, { taxRatePct: 0, shippingCents: 0 });
			if (!pricing.valid) continue;
			const discountCents = pricing.discountCents || (c.type === "shipping" ? pricing.shippingCents : 0) || 0;
			if (discountCents > bestDiscountCents) {
				bestDiscountCents = discountCents;
				best = c;
			}
		}

		if (!best) return res.json(null);
		return res.json({ code: best.code, type: best.type, value: best.value });
	} catch (error) {
		console.log("Error in getCoupon controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// POST /api/coupons/validate { code }
// Returns { valid, reason?, preview: { discountTotal, newTotals, applied } }
export const validateCoupon = async (req, res) => {
	try {
		const raw = (req.body?.code || "").trim().toUpperCase();
		if (!raw) return res.status(400).json({ valid: false, reason: "Code required" });

		const { lines } = await buildCartLines(req.userId);
		if (lines.length === 0) return res.status(400).json({ valid: false, reason: "Cart is empty" });

		const coupon = await Coupon.findOne({ code: raw, isActive: true }).lean();
		if (!coupon) return res.status(404).json({ valid: false, reason: "Coupon not found" });

		// First-order-only?
		if (coupon?.restrictions?.firstOrderOnly) {
			const hasPaid = await Order.exists({ user: req.userId, status: { $in: ["paid", "processing", "shipped", "delivered"] } });
			if (hasPaid) return res.status(400).json({ valid: false, reason: "First order only" });
		}

		// Usage limits
		if (typeof coupon.usageLimitTotal === "number" && coupon.usageLimitTotal > 0 && Number(coupon.usedCount || 0) >= coupon.usageLimitTotal) {
			return res.status(400).json({ valid: false, reason: "Coupon usage exceeded" });
		}
		if (typeof coupon.usageLimitPerCustomer === "number" && coupon.usageLimitPerCustomer > 0) {
			const usedBy = (coupon.usedBy || []).find((u) => String(u.userId) === String(req.userId));
			if (usedBy && usedBy.count >= coupon.usageLimitPerCustomer) {
				return res.status(400).json({ valid: false, reason: "You have reached usage limit" });
			}
		}

		const pricing = repriceCart(lines, coupon, { taxRatePct: 0, shippingCents: 0 });
		if (!pricing.valid) return res.status(400).json({ valid: false, reason: pricing.reason || "Ineligible" });

		return res.json({
			valid: true,
			preview: {
				discountTotal: fromCents(pricing.discountCents),
				newTotals: {
					subtotal: fromCents(pricing.subtotalCents),
					tax: fromCents(pricing.taxCents),
					shipping: fromCents(pricing.shippingCents),
					total: fromCents(pricing.totalCents),
				},
				applied: pricing.applied,
			},
			coupon: {
				code: coupon.code,
				type: coupon.type,
				value: coupon.value,
			},
		});
	} catch (error) {
		console.log("Error in validateCoupon controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// ===== Admin CRUD =====
export const listCoupons = async (req, res) => {
	try {
		const { search = "", active, page = 1, limit = 20 } = req.query;
		const q = {};
		if (search) q.code = { $regex: String(search).trim(), $options: "i" };
		if (active === "true") q.isActive = true;
		if (active === "false") q.isActive = false;
		const skip = (Number(page) - 1) * Number(limit);
		const [items, count] = await Promise.all([
			Coupon.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
			Coupon.countDocuments(q),
		]);
		res.json({ items, total: count, page: Number(page), limit: Number(limit) });
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createCoupon = async (req, res) => {
	try {
		const body = req.body || {};
		body.code = String(body.code || "").trim().toUpperCase();
		if (!body.code) return res.status(400).json({ message: "Code is required" });

		const filter = body.userId ? { userId: body.userId } : { code: body.code };
		const update = {
			$set: {
				code: body.code,
				type: body.type,
				value: body.value,
				startsAt: body.startsAt,
				endsAt: body.endsAt,
				minSubtotal: body.minSubtotal,
				usageLimitTotal: body.usageLimitTotal,
				usageLimitPerCustomer: body.usageLimitPerCustomer,
				restrictions: body.restrictions,
				isActive: body.isActive,
				userId: body.userId ?? null,
			},
			$setOnInsert: { createdAt: new Date() }
		};

		const createdOrUpdated = await Coupon.findOneAndUpdate(
			filter,
			update,
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		);

		return res.status(200).json(createdOrUpdated);
	} catch (error) {
		if (error?.code === 11000) {
			return res.status(409).json({ message: "Duplicate key", details: error.keyValue });
		}
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateCoupon = async (req, res) => {
	try {
		const { id } = req.params;
		const patch = { ...req.body };
		if (patch.code) patch.code = String(patch.code).trim().toUpperCase();
		const updated = await Coupon.findByIdAndUpdate(id, patch, { new: true });
		if (!updated) return res.status(404).json({ message: "Not found" });
		res.json(updated);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteCoupon = async (req, res) => {
	try {
		const { id } = req.params;
		const updated = await Coupon.findByIdAndUpdate(id, { isActive: false }, { new: true });
		if (!updated) return res.status(404).json({ message: "Not found" });
		res.json({ success: true });
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
