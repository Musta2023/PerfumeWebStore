import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CategoryItem = ({ category }) => {
	return (
		<motion.div
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			className="relative overflow-hidden h-80 w-full rounded-xl group shadow-lg border border-gray-700 bg-gray-900"
		>
			<Link to={`/category/${category.href}`} className="block h-full w-full">
				{/* Image and Overlay */}
				<div className="relative w-full h-full cursor-pointer">
					<img
						src={category.imageUrl}
						alt={category.name}
						className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 opacity-90"
						loading="lazy"
					/>
					<div className="absolute inset-0 b-linear-to-b from-transparent via-black/40 to-black/80 z-10" />
				</div>

				{/* Text Overlay */}
				<div className="absolute bottom-0 left-0 right-0 p-5 z-20">
					<h3 className="text-white text-2xl font-bold tracking-wide mb-1 drop-shadow-lg">
						{category.name}
					</h3>
					<p className="text-gray-300 text-sm">
						Discover luxurious {category.name.toLowerCase()} scents
					</p>
				</div>

				{/* Decorative Glow */}
				<div className="absolute inset-0 b-linear-to-tr from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-30 transition duration-500"></div>
			</Link>
		</motion.div>
	);
};

export default CategoryItem;
