import { useMemo } from "react";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { toast } from "react-hot-toast";

const ProductCard = ({ product }) => {
	const { addToCart } = useCartStore();

	const fmt = useMemo(
		() => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }),
		[]
	);

	return (
		<div className="group rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/10 h-full">
			<div className="aspect-[3/4] bg-slate-800/40 overflow-hidden relative">
				<img
					src={product.image}
					alt={product.name}
					className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
					loading="lazy"
				/>
				<div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/60 to-transparent opacity-50"></div>
			</div>
			<div className="p-4 flex flex-col h-full">
				<h3 className="text-[1.05rem] font-semibold mb-2 text-white/95 line-clamp-2 tracking-tight">{product.name}</h3>
				<p className="text-amber-300 font-semibold mb-4">
					{fmt.format(Number(product.price || 0))}
				</p>
				<button
					onClick={() => {
						if (!product?._id) {
							console.warn('Add to Cart blocked: missing _id for product', product);
							try { toast.error('This item is out of stock'); } catch {}
							return;
						}
						addToCart(product);
					}}
					disabled={!product?._id}
					className="mt-auto w-full border border-amber-400/50 text-amber-300 hover:text-amber-200 hover:bg-amber-400/10 disabled:border-slate-600 disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center hover:shadow-[0_0_18px_rgba(245,158,11,0.25)]"
					aria-label={`Add ${product.name} to cart`}
					title={!product?._id ? 'Unavailable item' : 'Add to Cart'}
				>
					<ShoppingCart className="w-5 h-5 mr-2" />
					Add to Cart
				</button>
			</div>
		</div>
	);
};

export default ProductCard;
