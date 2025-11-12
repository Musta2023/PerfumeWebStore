import { useState } from 'react';
import { Tag, X } from 'lucide-react';
import { useCartStore } from '../stores/useCartStore';

const CouponInput = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { coupon, isCouponApplied, applyCoupon, removeCoupon } = useCartStore();

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    await applyCoupon(code.trim());
    setLoading(false);
    if (isCouponApplied) setCode('');
  };

  const handleRemove = () => {
    removeCoupon();
    setCode('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  return (
    <div className="space-y-3">
      <label htmlFor="coupon-code" className="text-sm font-medium text-gray-300">
        Have a promo code?
      </label>
      
      {isCouponApplied && coupon ? (
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-emerald-400" />
            <span className="font-medium text-emerald-400">{coupon.code}</span>
            <span className="text-sm text-gray-400">
              {coupon.type === 'percent' ? `${coupon.value}% off` : 
               coupon.type === 'fixed' ? `$${(coupon.value / 100).toFixed(2)} off` : 
               'Free shipping'}
            </span>
          </div>
          <button
            onClick={handleRemove}
            className="text-gray-400 hover:text-red-400 transition-colors"
            aria-label="Remove coupon"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            id="coupon-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="Enter code"
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            aria-label="Coupon code"
            aria-describedby="coupon-hint"
          />
          <button
            onClick={handleApply}
            disabled={!code.trim() || loading}
            className="rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Apply coupon"
          >
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </div>
      )}
      
      <p id="coupon-hint" className="text-xs text-gray-500" role="status" aria-live="polite">
        {isCouponApplied ? 'Discount applied to your order' : 'Enter a valid promo code to get a discount'}
      </p>
    </div>
  );
};

export default CouponInput;
