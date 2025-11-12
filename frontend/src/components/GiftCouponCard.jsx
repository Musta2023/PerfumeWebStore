import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "../stores/useCartStore";

const GiftCouponCard = () => {
  const [userInputCode, setUserInputCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const { coupon, isCouponApplied, applyCoupon, getMyCoupon, removeCoupon } = useCartStore();

  // Fetch any saved coupon on mount
  useEffect(() => {
    getMyCoupon();
  }, [getMyCoupon]);

  // Mirror store coupon into the input field
  useEffect(() => {
    if (coupon?.code) setUserInputCode(coupon.code);
  }, [coupon]);

  // Normalized code (trim + uppercase)
  const normalized = useMemo(
    () => userInputCode.trim().toUpperCase(),
    [userInputCode]
  );

  const alreadyAppliedSame =
    isCouponApplied && coupon?.code?.toUpperCase() === normalized && normalized.length > 0;

  const canApply = normalized.length > 0 && !alreadyAppliedSame && !busy;

  const handleApplyCoupon = async () => {
    if (!canApply) return;
    setBusy(true);
    setMsg({ type: "", text: "" });

    try {
      await applyCoupon(normalized);
      setMsg({ type: "success", text: `Coupon ${normalized} applied.` });
    } catch (err) {
      const text =
        err?.response?.data?.message ||
        err?.message ||
        "Could not apply coupon. Please try again.";
      setMsg({ type: "error", text });
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (busy) return;
    setBusy(true);
    setMsg({ type: "", text: "" });

    try {
      await removeCoupon();
      setUserInputCode("");
      setMsg({ type: "success", text: "Coupon removed." });
    } catch (err) {
      const text =
        err?.response?.data?.message ||
        err?.message ||
        "Could not remove coupon. Please try again.";
      setMsg({ type: "error", text });
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  return (
    <motion.div
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="voucher" className="mb-2 block text-sm font-medium text-gray-300">
            Do you have a voucher or gift card?
          </label>

          <input
            type="text"
            id="voucher"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            className="block w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
            placeholder="Enter code here"
            value={userInputCode}
            onChange={(e) => setUserInputCode(e.target.value)}
            onKeyDown={onKeyDown}
            aria-describedby="voucher-help"
          />

          <p id="voucher-help" className="mt-1 text-xs text-gray-400">
            Codes aren’t case-sensitive; we’ll format them for you.
          </p>
        </div>

        <motion.button
          type="button"
          className={`flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white transition
            ${canApply ? "bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300" : "bg-gray-600 cursor-not-allowed"}`}
          whileHover={canApply ? { scale: 1.05 } : {}}
          whileTap={canApply ? { scale: 0.95 } : {}}
          onClick={handleApplyCoupon}
          disabled={!canApply}
          aria-disabled={!canApply}
        >
          {alreadyAppliedSame ? "Already Applied" : busy ? "Applying..." : "Apply Code"}
        </motion.button>

        {msg.text ? (
          <div
            className={`text-sm ${msg.type === "error" ? "text-red-400" : "text-emerald-300"}`}
            role={msg.type === "error" ? "alert" : "status"}
          >
            {msg.text}
          </div>
        ) : null}
      </div>

      {isCouponApplied && coupon && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-300">Applied Coupon</h3>
          <p className="mt-2 text-sm text-gray-400">
            {coupon.code} — {coupon.discountPercentage}% off
          </p>

          <motion.button
            type="button"
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-60"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRemoveCoupon}
            disabled={busy}
          >
            {busy ? "Removing..." : "Remove Coupon"}
          </motion.button>
        </div>
      )}

      {/* Optional: show available coupon even if not applied */}
      {!isCouponApplied && coupon && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-300">Your Available Coupon:</h3>
          <p className="mt-2 text-sm text-gray-400">
            {coupon.code} — {coupon.discountPercentage}% off
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default GiftCouponCard;
