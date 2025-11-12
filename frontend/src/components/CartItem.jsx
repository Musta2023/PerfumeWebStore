import { Minus, Plus, Trash } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { useMemo } from "react";

const currency = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n)
    : "$0.00";

const CartItem = ({ item }) => {
  const { removeFromCart, updateQuantity } = useCartStore();

  // Safe guards
  const minQty = 1;
  const maxQty = typeof item?.stock === "number" && item.stock > 0 ? item.stock : Infinity;

  const canDecrement = (item?.quantity ?? 1) > minQty;
  const canIncrement = (item?.quantity ?? 1) < maxQty;

  const unitPrice = Number(item?.price || 0);
  const qty = Number(item?.quantity || 1);

  const lineTotal = useMemo(() => unitPrice * qty, [unitPrice, qty]);

  const dec = () => {
    if (!canDecrement) return;
    updateQuantity(item._id, Math.max(minQty, qty - 1));
  };

  const inc = () => {
    if (!canIncrement) return;
    updateQuantity(item._id, Math.min(maxQty, qty + 1));
  };

  const remove = () => removeFromCart(item._id);

  return (
    <div className="rounded-lg border p-4 shadow-sm border-gray-700 bg-gray-800 md:p-6">
      <div className="space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0">
        {/* Image */}
        <div className="shrink-0 md:order-1">
          <img
            className="h-20 md:h-32 w-20 md:w-32 rounded object-cover bg-gray-900/40"
            src={item.image}
            alt={item.name || "Cart item"}
            loading="lazy"
          />
        </div>

        {/* Price block (right on desktop) */}
        <div className="flex items-center justify-between md:order-3 md:justify-end .md:min-w-[10rem]">
          {/* Qty controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Decrease quantity"
              aria-label="Decrease quantity"
              disabled={!canDecrement}
              onClick={dec}
              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border 
                border-gray-600 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500
                disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Minus className="h-4 w-4 text-gray-300" />
            </button>

            <p className="min-w-[2ch] text-center text-gray-100">{qty}</p>

            <button
              type="button"
              title="Increase quantity"
              aria-label="Increase quantity"
              disabled={!canIncrement}
              onClick={inc}
              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border 
                border-gray-600 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500
                disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Plus className="h-4 w-4 text-gray-300" />
            </button>
          </div>

          {/* Line total */}
          <div className="text-end md:order-4 md:w-36 ml-4">
            <p className="text-base font-bold text-emerald-400">{currency(lineTotal)}</p>
            <p className="text-xs text-gray-400">
              {currency(unitPrice)} <span className="mx-1">×</span> {qty}
            </p>
          </div>
        </div>

        {/* Info + remove */}
        <div className="w-full min-w-0 flex-1 space-y-3 md:order-2 md:max-w-md">
          <p className="text-base font-medium text-white hover:text-emerald-400 hover:underline line-clamp-2">
            {item.name}
          </p>
          {item?.description ? (
            <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>
          ) : null}

          <div className="flex items-center gap-4">
            {/* Optional stock hint */}
            {Number.isFinite(maxQty) && (
              <span className="text-xs text-gray-400">In stock: {maxQty}</span>
            )}

            <button
              type="button"
              onClick={remove}
              className="inline-flex items-center text-sm font-medium text-red-400 hover:text-red-300 hover:underline"
              aria-label={`Remove ${item.name || "item"} from cart`}
              title="Remove from cart"
            >
              <Trash className="h-4 w-4 mr-1" />
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
