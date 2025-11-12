import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { toast } from "react-hot-toast";

const FeaturedProducts = ({ featuredProducts = [], showViewAll = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  const { addToCart } = useCartStore();
  const trackRef = useRef(null);

  // Currency formatter (change currency if needed)
  const fmt = useMemo(
    () => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }),
    []
  );

  // Responsive itemsPerPage + clamp index on breakpoint change
  useEffect(() => {
    const handleResize = () => {
      let next = 4;
      const w = window.innerWidth;
      if (w < 640) next = 1;
      else if (w < 1024) next = 2;
      else if (w < 1280) next = 3;

      setItemsPerPage((prev) => {
        if (prev === next) return prev;
        // Clamp index so the last page is valid for the new per-page
        setCurrentIndex((idx) => {
          const maxStart = Math.max(0, featuredProducts.length - next);
          return Math.min(idx, maxStart);
        });
        return next;
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // include featuredProducts.length so we re-clamp if the list changes
  }, [featuredProducts.length]);

  const maxStart = Math.max(0, featuredProducts.length - itemsPerPage);
  const isStartDisabled = currentIndex <= 0;
  const isEndDisabled = currentIndex >= maxStart;

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + itemsPerPage, maxStart));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - itemsPerPage, 0));
  };

  // Keyboard nav (←/→)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maxStart, itemsPerPage]);

  // Basic swipe support
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let startX = 0;
    let dx = 0;

    const onTouchStart = (e) => {
      startX = e.touches[0].clientX;
      dx = 0;
    };
    const onTouchMove = (e) => {
      dx = e.touches[0].clientX - startX;
    };
    const onTouchEnd = () => {
      const threshold = 40; // px
      if (dx < -threshold) nextSlide();
      if (dx > threshold) prevSlide();
      startX = 0;
      dx = 0;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [maxStart, itemsPerPage]);

  if (!featuredProducts.length) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-5xl sm:text-6xl font-bold font-luxury bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent mb-2">Featured</h2>
          <p className="text-center text-gray-400">No featured products yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6 text-center">
          <h2 className="text-5xl sm:text-6xl font-bold font-luxury bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent">Featured</h2>
          {showViewAll && (
            <Link
              to="/featured"
              className="inline-block mt-3 text-amber-300 hover:text-amber-200 text-sm border border-amber-400/40 rounded-full px-4 py-1 transition-colors"
            >
              View all →
            </Link>
          )}
        </div>

        <div className="relative">
          <div className="overflow-hidden" ref={trackRef}>
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
              aria-live="polite"
            >
              {featuredProducts.map((product) => (
                <div
                  key={product._id}
                  className="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-2"
                >
                  <div className="group rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/10 h-full">
                    <div className="aspect-[3/4] bg-slate-800/40 overflow-hidden relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/60 to-transparent opacity-50"></div>
                      <button
                        onClick={() => { if (!product?._id) { try { toast.error('This item is unavailable'); } catch {} ; return; } addToCart(product); }}
                        disabled={!product?._id}
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 border border-amber-400/50 text-amber-200 bg-black/30 hover:bg-amber-400/10 backdrop-blur-sm rounded-md px-3 py-1.5 text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
                        aria-label={`Add ${product.name} to cart`}
                        title={!product?._id ? 'Unavailable item' : 'Add to Cart'}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                    </div>
                    <div className="p-4 flex flex-col h-full">
                      <h3 className="text-[1.05rem] font-semibold mb-2 text-white/95 line-clamp-2 tracking-tight">{product.name}</h3>
                      <p className="text-amber-300 font-semibold mb-4">{fmt.format(Number(product.price || 0))}</p>
                      <button
                        onClick={() => { if (!product?._id) { try { toast.error('This item is unavailable'); } catch {} ; return; } addToCart(product); }}
                        className="mt-auto w-full border border-amber-400/50 text-amber-300 hover:text-amber-200 hover:bg-amber-400/10 disabled:border-slate-600 disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center hover:shadow-[0_0_18px_rgba(245,158,11,0.25)]"
                        aria-label={`Add ${product.name} to cart`}
                        title="Add to Cart"
                        disabled={!product?._id}
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prev */}
          <button
            onClick={prevSlide}
            disabled={isStartDisabled}
            className={`absolute top-1/2 -left-4 -translate-y-1/2 p-2 rounded-full transition-colors duration-300 border border-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 
              ${isStartDisabled ? "bg-white/10 cursor-not-allowed" : "bg-white/10 hover:bg-amber-500/20"}`}
            aria-label="Previous featured products"
            title="Previous"
          >
            <ChevronLeft className="w-6 h-6 text-amber-200" />
          </button>

          {/* Next */}
          <button
            onClick={nextSlide}
            disabled={isEndDisabled}
            className={`absolute top-1/2 -right-4 -translate-y-1/2 p-2 rounded-full transition-colors duration-300 border border-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 
              ${isEndDisabled ? "bg-white/10 cursor-not-allowed" : "bg-white/10 hover:bg-amber-500/20"}`}
            aria-label="Next featured products"
            title="Next"
          >
            <ChevronRight className="w-6 h-6 text-amber-200" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProducts;
