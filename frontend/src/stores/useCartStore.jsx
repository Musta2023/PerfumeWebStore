import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
	cart: [],
	missingCartItems: [], // [{ id, quantity }] that no longer exist
	coupon: null, // { code, type, value }
	previewTotals: null, // server-calculated totals when coupon applied
	total: 0,
	subtotal: 0,
	isCouponApplied: false,

	getMyCoupon: async () => {
		try {
			const response = await axios.get("/coupons");
			// Response may be { code, type, value } or null; store as coupon suggestion (not applied yet)
			set({ coupon: response.data || null });
		} catch (error) {
			console.error("Error fetching coupon:", error);
		}
	},
	// Attempt to auto-apply a first-order coupon for the user when eligible.
	autoApplyFirstOrderCoupon: async () => {
		try {
			const state = get();
			if (!Array.isArray(state.cart) || state.cart.length === 0) return; // nothing to discount yet
			if (state.isCouponApplied || state.coupon?.code) return; // already applied or chosen
			const res = await axios.get("/coupons");
			const c = res?.data;
			if (c?.code) {
				await get().applyCoupon(c.code);
			}
		} catch (err) {
			// silent fail; not eligible or no coupon
		}
	},
	applyCoupon: async (code) => {
		try {
			const response = await axios.post("/coupons/validate", { code });
			if (!response.data?.valid) throw new Error(response.data?.reason || "Invalid coupon");
			const { coupon, preview } = response.data;
			set({ coupon, isCouponApplied: true, previewTotals: preview.newTotals });
			get().calculateTotals();
			toast.success("Coupon applied successfully");
		} catch (error) {
			toast.error(error.response?.data?.reason || error.message || "Failed to apply coupon");
		}
	},
	removeCoupon: () => {
		set({ coupon: null, isCouponApplied: false, previewTotals: null });
		get().calculateTotals();
		toast.success("Coupon removed");
	},

	getCartItems: async () => {
		try {
			const res = await axios.get("/cart");
			const data = res?.data;
			const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
			// Hide any missing/unavailable banner/list from checkout page
			set({ cart: items, missingCartItems: [] });
			get().calculateTotals();
		} catch (error) {
			set({ cart: [] });
			if (error?.response?.status !== 401) {
				toast.error(error.response?.data?.message || "An error occurred");
			}
		}
	},
	clearCart: async () => {
		set({ cart: [], coupon: null, total: 0, subtotal: 0, previewTotals: null, isCouponApplied: false });
	},
	addToCart: async (product) => {
		try {
			await axios.post("/cart", { productId: product._id });
			toast.success("Product added to cart");

			set((prevState) => {
				const existingItem = prevState.cart.find((item) => item._id === product._id);
				const newCart = existingItem
					? prevState.cart.map((item) =>
							item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
					  )
					: [...prevState.cart, { ...product, quantity: 1 }];
				return { cart: newCart };
			});
			get().calculateTotals();
		} catch (error) {
			if (error?.response?.status !== 401) {
				toast.error(error.response?.data?.message || "An error occurred");
			}
		}
	},
	removeFromCart: async (productId) => {
		await axios.delete(`/cart`, { data: { productId } });
		set((prevState) => ({ cart: prevState.cart.filter((item) => item._id !== productId) }));
		get().calculateTotals();
	},
	updateQuantity: async (productId, quantity) => {
		if (quantity === 0) {
			get().removeFromCart(productId);
			return;
		}

		await axios.put(`/cart/${productId}`, { quantity });
		set((prevState) => ({
			cart: prevState.cart.map((item) => (item._id === productId ? { ...item, quantity } : item)),
		}));
		get().calculateTotals();
	},
	calculateTotals: () => {
		const { cart, coupon, previewTotals } = get();
		const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
		let total = subtotal;
		if (coupon && previewTotals) {
			// trust server preview totals
			set({ subtotal: previewTotals.subtotal, total: previewTotals.total });
			return;
		}
		set({ subtotal, total });
	},
}));
