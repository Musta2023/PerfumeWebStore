import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Sparkles, TrendingUp, Star } from 'lucide-react';
import { useCartStore } from '../stores/useCartStore';
import { toast } from 'react-hot-toast';
import { CATEGORIES } from '../constants/categories';
import FeaturedProducts from '../components/FeaturedProducts';

const categories = CATEGORIES.map((name) => ({
  href: `/category/${encodeURIComponent(name)}`,
  name,
}));

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [featured, setFeatured] = useState([]);
  const { addToCart } = useCartStore();
  const [catImages, setCatImages] = useState({});

  useEffect(() => {
    const fetchRecommended = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch('/api/products/recommendations');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Failed to load products');
        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/products/featured');
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || 'Failed to load featured');
        setFeatured(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRecommended();
    fetchFeatured();
  }, []);

  // Load a representative image for each category (first product image if available)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const entries = await Promise.all(
          categories.map(async (c) => {
            try {
              const res = await fetch(`/api/products/category/${encodeURIComponent(c.name)}`);
              if (!res.ok) return [c.name, null];
              const data = await res.json().catch(() => ({}));
              const img = Array.isArray(data?.products)
                ? (data.products.find((p) => p && p.image)?.image || data.products[0]?.image || null)
                : null;
              return [c.name, img || null];
            } catch {
              return [c.name, null];
            }
          })
        );
        if (!cancelled) setCatImages(Object.fromEntries(entries));
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-300 font-medium">Premium Fragrance Collection</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent leading-tight">
            Discover Your
            <br />
            Signature Scent
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Explore our curated collection of luxury fragrances, crafted to elevate every moment
          </p>

        </div>

        <section className="py-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-1 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full"></div>
            <h2 className="text-3xl font-bold text-white">Fragrance Families</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((c) => (
              <Link
                key={c.name}
                to={c.href}
                className="group relative rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 h-20 sm:h-24 px-3 sm:px-4 flex items-center gap-3"
              >
                <div className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/10 overflow-hidden">
                  {catImages[c.name] ? (
                    <img src={catImages[c.name]} alt={`${c.name} sample`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm sm:text-base text-gray-200 group-hover:text-white">{c.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-base font-medium text-white truncate group-hover:text-amber-200">
                    {c.name}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-400 truncate">Explore {c.name.toLowerCase()}</div>
                </div>
                <span className="text-gray-500 group-hover:text-emerald-300 transition-colors">→</span>
              </Link>
            ))}
          </div>
        </section>

        {featured.length > 0 && (
          <section className="py-12">
            <div className="flex items-center gap-2 mb-8">
              <div className="h-8 w-1 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full"></div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
                Featured Collection
              </h2>
            </div>
            <FeaturedProducts featuredProducts={featured} showViewAll />
          </section>
        )}

        <section className="py-12 pb-20">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-8 w-1 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full"></div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-amber-400" />
              Recommended for You
            </h2>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-white/5 bg-slate-800/30 animate-pulse">
                  <div className="aspect-[3/4] bg-slate-700/50"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-slate-700/50 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-700/50 rounded w-full"></div>
                    <div className="h-4 bg-slate-700/50 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12 px-4 rounded-2xl border border-red-500/20 bg-red-500/5">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {!isLoading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <div
                  key={p._id}
                  className="group rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:border-amber-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-amber-500/10 backdrop-blur-sm"
                >
                  <div className="aspect-[3/4] bg-gradient-to-br from-slate-700/40 to-slate-800/40 relative overflow-hidden">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-7xl opacity-20">{p.name?.charAt(0) || '?'}</div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-60"></div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-lg text-white group-hover:text-amber-300 transition-colors duration-300">
                      {p.name}
                    </h3>
                    {p.description && (
                      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-2xl font-bold text-amber-400">
                        ${Number(p.price).toFixed(2)}
                      </span>
                      <button
                        onClick={() => {
                          if (!p?._id) {
                            try {
                              toast.error('This item is unavailable');
                            } catch {}
                            return;
                          }
                          addToCart(p);
                        }}
                        disabled={!p?._id}
                        className="border border-amber-400/50 text-amber-300 hover:text-amber-200 hover:bg-amber-400/10 disabled:border-slate-600 disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed font-medium py-2.5 px-5 rounded-lg transition-all duration-300 flex items-center gap-2 hover:shadow-[0_0_18px_rgba(245,158,11,0.25)]"
                        aria-label={`Add ${p.name} to cart`}
                        title={!p?._id ? 'Unavailable item' : 'Add to Cart'}
                      >
                        <ShoppingCart className="w-5 h-5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && !error && products.length === 0 && (
            <div className="text-center py-16 px-4 rounded-2xl border border-white/5 bg-slate-800/30">
              <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No recommendations available at the moment</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;
