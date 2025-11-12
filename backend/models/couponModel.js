import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
			trim: true,
		},
		// Type: percent, fixed (amount off), or shipping (free shipping)
		type: {
			type: String,
			enum: ["percent", "fixed", "shipping"],
			required: true,
			default: "percent",
		},
		// For percent: 0-100 (e.g., 20 = 20%), for fixed: amount in minor units (e.g., 1000 = $10.00)
		value: {
			type: Number,
			required: true,
			min: 0,
		},
		// Date range for coupon validity
		startsAt: {
			type: Date,
			default: Date.now,
		},
		endsAt: {
			type: Date,
			required: true,
		},
		// Minimum subtotal required (in minor units, e.g., 5000 = $50.00)
		minSubtotal: {
			type: Number,
			min: 0,
			default: 0,
		},
		// Usage limits
		usageLimitTotal: {
			type: Number,
			min: 0,
			default: null, // null = unlimited
		},
		usageLimitPerCustomer: {
			type: Number,
			min: 0,
			default: 1,
		},
		usedCount: {
			type: Number,
			min: 0,
			default: 0,
		},
		// Track which users have used this coupon (for per-customer limits)
		usedBy: [{
			userId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
			count: {
				type: Number,
				default: 1,
			},
			lastUsedAt: {
				type: Date,
				default: Date.now,
			},
		}],
		// Restrictions
		restrictions: {
			// Array of fragrance families (e.g., ["Citrus", "Woody"])
			families: [{
				type: String,
			}],
			// Array of specific product IDs
			productIds: [{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Product",
			}],
			// Only for first-time customers
			firstOrderOnly: {
				type: Boolean,
				default: false,
			},
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		// Optional: for user-specific coupons (loyalty rewards), null = global coupon
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

// Index for efficient queries
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ userId: 1, isActive: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
