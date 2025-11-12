import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "../lib/axios";
import CouponInput from "./CouponInput";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";

// ✅ Stripe.js (Clover 2025) - ensure library is available (no deprecated redirectToCheckout)
const OrderSummary = () => {
  const { total, subtotal, coupon, isCouponApplied } = useCartStore();
  const getCartItems = useCartStore((s) => s.getCartItems);

  const [delivery, setDelivery] = useState(() => {
    // try restore from localStorage so users don't lose input
    try {
      const raw = localStorage.getItem("delivery_info");
      return raw ? JSON.parse(raw) : { name: "", address: "", phone: "" };
    } catch {
      return { name: "", address: "", phone: "" };
    }
  });

  useEffect(() => {
    try { localStorage.setItem("delivery_info", JSON.stringify(delivery)); } catch {}
  }, [delivery]);

  const savings = subtotal - total;
  const formattedSubtotal = subtotal.toFixed(2);
  const formattedTotal = total.toFixed(2);
  const formattedSavings = savings.toFixed(2);

  const handlePayment = async () => {
    try {
      // basic validation
      if (!delivery.name.trim() || !delivery.address.trim() || !delivery.phone.trim()) {
        toast.error("Please fill name, address and phone before checkout");
        return;
      }
      // Ensure Stripe.js is initialized (not strictly required for URL redirect but future-proof)
      try { await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY); } catch {}

      // Refresh cart from server to avoid stale client state
      try { await getCartItems(); } catch {}

      // Build minimal payload from latest store state
      const currentCart = useCartStore.getState().cart;
      const productsPayload = Array.isArray(currentCart)
        ? currentCart
            .filter((it) => Number(it?.price) > 0 && it?.placeholder !== true && it?.isActive !== false)
            .map((it) => ({
              id: String(it._id || it.id || it.product || it.productId || ""),
              quantity: Number(it.quantity || 1),
            }))
            .filter((p) => p.id && Number.isFinite(p.quantity) && p.quantity > 0)
        : [];

      if (productsPayload.length === 0) {
        toast.error("Your cart is empty");
        return;
      }

      const res = await axios.post("/payments/create-checkout-session", {
        products: productsPayload,
        couponCode: coupon ? coupon.code : null,
        delivery: {
          name: delivery.name.trim(),
          address: delivery.address.trim(),
          phone: delivery.phone.trim(),
        },
      });

      const url = res?.data?.url;
      if (url) {
        window.location.href = url; // New Clover-compatible redirect
        return;
      }

      const msg = res?.data?.message || res?.data?.error || "Failed to create checkout session";
      toast.error(msg);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err.message || "Payment error";
      toast.error(msg);
      console.error("Payment error:", err);
    }
  };

  return (
    <motion.div
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-xl font-semibold text-emerald-400">Order summary</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-gray-300">Subtotal</dt>
            <dd className="text-base font-medium text-white">${formattedSubtotal}</dd>
          </dl>

          {savings > 0 && coupon && isCouponApplied && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal text-gray-300">
                Discount ({coupon.code})
              </dt>
              <dd className="text-base font-medium text-emerald-400">
                -${formattedSavings}
              </dd>
            </dl>
          )}

          <dl className="flex items-center justify-between gap-4 border-t border-gray-600 pt-2">
            <dt className="text-base font-bold text-white">Total</dt>
            <dd className="text-base font-bold text-emerald-400">${formattedTotal}</dd>
          </dl>
        </div>

        {/* Delivery details */}
        <div className="space-y-2 rounded-md border border-gray-700/60 bg-gray-900/40 p-3">
          <p className="text-sm font-medium text-gray-200">Delivery information</p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Full name"
              className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={delivery.name}
              onChange={(e) => setDelivery((d) => ({ ...d, name: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Address"
              className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={delivery.address}
              onChange={(e) => setDelivery((d) => ({ ...d, address: e.target.value }))}
            />
            <input
              type="tel"
              placeholder="Phone"
              className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={delivery.phone}
              onChange={(e) => setDelivery((d) => ({ ...d, phone: e.target.value }))}
            />
          </div>
        </div>

        <CouponInput />

        <motion.button
          className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePayment}
        >
          Proceed to Checkout
        </motion.button>

        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-normal text-gray-400">or</span>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 underline hover:text-emerald-300 hover:no-underline"
          >
            Continue Shopping
            <MoveRight size={16} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderSummary;
