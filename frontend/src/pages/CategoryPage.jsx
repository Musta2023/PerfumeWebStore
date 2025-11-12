import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ProductCard from '../components/ProductCard'

const __FM = motion;

const CategoryPage = () => {
  const { categoryName } = useParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!categoryName) return
    const fetchByCategory = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/products/category/${encodeURIComponent(categoryName)}`)
        // Treat 404 as empty category rather than an error
        if (res.status === 404) {
          setProducts([])
          return
        }
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.message || 'Failed to load products')
        setProducts(Array.isArray(data.products) ? data.products : [])
      } catch (err) {
        setError(err.message || 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    fetchByCategory()
  }, [categoryName])

  const title = categoryName ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1) : 'Category'

  return (
    <div className='min-h-screen'>
      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <motion.h1
          className='text-center text-4xl sm:text-5xl font-bold text-emerald-400 mb-8'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {title}
        </motion.h1>

        {loading && <p className='text-gray-400 text-center'>Loading…</p>}
        {error && <p className='text-red-400 text-center'>{error}</p>}

        <motion.div
          className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {!loading && !error && products?.length === 0 && (
            <div className='col-span-full text-center space-y-3'>
              <h2 className='text-3xl font-semibold text-gray-200'>No products found</h2>
              <p className='text-gray-400'>Try a different category or go back to the home page.</p>
              <div>
                <Link to='/' className='inline-block px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors'>
                  Back to Home
                </Link>
              </div>
            </div>
          )}

          {products?.map((p) => (
            <div key={p._id} className='w-full max-w-sm'>
              <ProductCard product={p} />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
export default CategoryPage
