import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import Coupon from "../models/couponModel.js";
import { repriceCart } from "../lib/cartPricing.js";

// Normalize cart items possibly stored as raw IDs (legacy) or objects { productId, quantity }
const normalizeCartItems = (raw = []) => {
  return raw.map((i) => {
    if (i && typeof i === "object" && "productId" in i) {
      return {
        productId: i.productId?.toString?.() || String(i.productId),
        quantity: Number(i.quantity) > 0 ? Number(i.quantity) : 1,
      };
    }
    // legacy plain id
    return { productId: i?.toString?.() || String(i), quantity: 1 };
  });
};

async function loadCartLines(user) {
  const items = normalizeCartItems(user.cartItems || []);
  const ids = items.map((i) => i.productId);
  const products = ids.length ? await Product.find({ _id: { $in: ids }, isActive: true }).select("_id name price category image").lean() : [];
  const map = new Map(products.map((p) => [String(p._id), p]));
  const lines = items.filter((it) => map.has(it.productId)).map((it) => {
    const p = map.get(it.productId);
    return { id: it.productId, productId: it.productId, qty: it.quantity, unitAmountCents: Math.round(Number(p.price) * 100), family: p.category };
  });
  return { lines, products };
}

export const getCartProducts = async (req, res) => {
  try {
    // Load user fresh from DB to avoid any chance of stale embedded cart from middleware
    const freshUser = await User.findById(req.userId).select('cartItems').lean();
    const items = normalizeCartItems(freshUser?.cartItems || []);
    const ids = items.map((i) => i.productId);
    if (ids.length === 0) return res.json({ items: [], missingItems: [] });

    // Fetch whatever products still exist; do not filter by isActive here so users can remove legacy items
    const products = await Product.find({ _id: { $in: ids } })
      .select("_id name price category image isActive placeholder createdBy")
      .lean();

    const productMap = new Map(products.map((p) => [String(p._id), p]));

    // Determine missing items (deleted/unknown)
    let missingItems = items
      .filter((i) => !productMap.has(String(i.productId)))
      .map((i) => ({ id: String(i.productId), quantity: i.quantity, reason: 'missing' }));

    // Build items in user order with normalized fields
    const rawCartItems = items
      .map(({ productId, quantity }) => {
        const p = productMap.get(String(productId));
        if (!p) return null;
        return {
          _id: p._id,
          name: p.name,
          price: Number(p.price || 0),
          image: (Array.isArray(p.images) && p.images.length ? p.images[0] : (p.image || "")),
          isActive: p.isActive !== false,
          placeholder: !!p.placeholder,
          createdBy: p.createdBy,
          quantity: Number(quantity || 1),
        };
      })
      .filter(Boolean);

    // Treat unavailable items (out of stock/inactive/placeholder or non-positive price) as missing for checkout/cart UI
    const availableItems = [];
    for (const it of rawCartItems) {
      const unavailable = it.placeholder === true || it.isActive === false || !(Number(it.price) > 0) || !it.createdBy;
      if (unavailable) {
        missingItems.push({ id: String(it._id), quantity: it.quantity, reason: 'out_of_stock' });
      } else {
        availableItems.push(it);
      }
    }

    if (missingItems.length > 0) {
      try {
        console.warn(`[cart] user ${req.userId} has unavailable/missing items:`, missingItems.map(m => m.id));
      } catch {}
    }

    const payload = { items: availableItems, missingItems: [], requestedIds: ids };

    res.json(payload);
  } catch (error) {
    console.log("Error in getCartProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: "productId is required" });

    const [user, product] = await Promise.all([
      User.findById(req.userId),
      Product.findById(productId).lean(),
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!product || product.placeholder === true || product.isActive === false || Number(product.price) <= 0 || !product.createdBy) {
      return res.status(400).json({ message: "This item is unavailable for purchase" });
    }

    const existing = user.cartItems.find((i) => i?.productId?.toString() === productId || i?.toString() === productId);
    if (existing && typeof existing === "object") {
      existing.quantity = (existing.quantity || 1) + 1;
    } else if (existing) {
      user.cartItems = normalizeCartItems(user.cartItems).map((i) =>
        i.productId === productId ? { productId, quantity: (i.quantity || 1) + 1 } : i
      );
    } else {
      user.cartItems.push({ productId, quantity: 1 });
    }

    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    console.log("Error in addToCart controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body || {};
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!productId) {
      user.cartItems = [];
    } else {
      user.cartItems = normalizeCartItems(user.cartItems).filter((i) => i.productId !== productId);
    }

    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    if (quantity == null) return res.status(400).json({ message: "quantity is required" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const items = normalizeCartItems(user.cartItems);
    const idx = items.findIndex((i) => i.productId === productId);

    if (idx === -1) return res.status(404).json({ message: "Product not found" });

    if (Number(quantity) === 0) {
      user.cartItems = items.filter((i) => i.productId !== productId);
      await user.save();
      return res.json(user.cartItems);
    }

    items[idx].quantity = Number(quantity);
    user.cartItems = items;
    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    console.log("Error in updateQuantity controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const code = String(req.body?.code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ message: "Code is required" });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { lines } = await loadCartLines(user);
    if (lines.length === 0) return res.status(400).json({ message: "Cart is empty" });

    const coupon = await Coupon.findOne({ code, isActive: true }).lean();
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    const pricing = repriceCart(lines, coupon, { taxRatePct: 0, shippingCents: 0 });
    if (!pricing.valid) return res.status(400).json({ message: pricing.reason || "Ineligible" });

    return res.json({
      applied: pricing.applied,
      totals: {
        subtotal: pricing.subtotalCents / 100,
        tax: pricing.taxCents / 100,
        shipping: pricing.shippingCents / 100,
        discount: pricing.discountCents / 100,
        total: pricing.totalCents / 100,
      },
    });
  } catch (error) {
    console.log("Error in applyCoupon controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const removeCoupon = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { lines } = await loadCartLines(user);
    const pricing = repriceCart(lines, null, { taxRatePct: 0, shippingCents: 0 });
    return res.json({
      applied: null,
      totals: {
        subtotal: pricing.subtotalCents / 100,
        tax: pricing.taxCents / 100,
        shipping: pricing.shippingCents / 100,
        discount: pricing.discountCents / 100,
        total: pricing.totalCents / 100,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
