import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '../stores/useCartStore'

const FeaturedPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { addToCart } = useCartStore()
  const fmt = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }), [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/products/featured')
        const data = await res.json().catch(() => [])
        if (!res.ok) throw new Error((data && data.message) || 'Failed to load featured')
        setItems(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'Failed to load featured')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'>
      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <motion.h1
          className='text-center text-4xl sm:text-5xl font-bold font-luxury bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent mb-8'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Featured Products
        </motion.h1>

        {loading && <p className='text-gray-400 text-center'>Loading…</p>}
        {error && <p className='text-red-400 text-center'>{error}</p>}

        <motion.div
          className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {!loading && !error && items.length === 0 && (
            <h2 className='text-2xl font-semibold text-gray-300 text-center col-span-full'>
              No featured products yet
            </h2>
          )}

          {items.map((p) => (
            <div key={p._id} className='group w-full max-w-sm rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/10'>
              <div className='aspect-[3/4] bg-slate-800/40 relative overflow-hidden'>
                {p.image ? (
                  <img src={p.image} alt={p.name} className='w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out' />
                ) : (
                  <span className='text-xs text-slate-400'>Image</span>
                )}
                <div className='absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-50 pointer-events-none'></div>
              </div>
              <div className='p-4 flex flex-col h-full'>
                <div className='font-semibold text-white/95 line-clamp-2'>{p.name}</div>
                <div className='text-sm text-slate-400 line-clamp-2'>{p.description}</div>
                <div className='mt-2 font-bold text-amber-300'>{fmt.format(Number(p.price || 0))}</div>
                <button
                  onClick={() => { if (!p?._id) return; addToCart(p) }}
                  disabled={!p?._id}
                  className='mt-3 w-full border border-amber-400/50 text-amber-300 hover:text-amber-200 hover:bg-amber-400/10 disabled:border-slate-600 disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-[0_0_18px_rgba(245,158,11,0.25)]'
                  aria-label={`Add ${p.name} to cart`}
                  title={!p?._id ? 'Unavailable item' : 'Add to Cart'}
                >
                  <ShoppingCart className='w-5 h-5' />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default FeaturedPage
