import mongoose from "mongoose";


const orderSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		products: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
					required: true,
				},
				quantity: {
					type: Number,
					required: true,
					min: 1,
				},
				price: {
					type: Number,
					required: true,
					min: 0,
				},
			},
		],
	// Delivery info (collected before checkout)
	deliveryName: { type: String, required: true },
	deliveryAddress: { type: String, required: true },
	deliveryPhone: { type: String, required: true },
	totalAmount: {
		type: Number,
		required: true,
		min: 0,
	},
	// Discount and coupon tracking
	discountTotal: {
		type: Number,
		min: 0,
		default: 0,
	},
	couponCode: {
		type: String,
		default: null,
	},
	couponSnapshot: {
		type: mongoose.Schema.Types.Mixed,
		default: null,
	},
	// Amounts breakdown (in major units for display)
	amounts: {
		subtotal: { type: Number, default: 0 },
		tax: { type: Number, default: 0 },
		shipping: { type: Number, default: 0 },
		total: { type: Number, default: 0 },
	},
	stripeSessionId: {
		type: String,
		unique: true,
	},
	status: {
		type: String,
		enum: ["pending", "processing", "paid", "shipped", "delivered", "cancelled", "refunded"],
		default: "pending",
		required: true,
	},
	},
	{ timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
