import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CATEGORIES } from '../constants/categories'

const ICONS = {
  Floral: '🌸',
  Woody: '🌲',
  Citrus: '🍊',
  Oriental: '🕌',
  Fresh: '💧',
  Fruity: '🍓',
  Spicy: '🌶️',
  Gourmand: '🍯',
  Aquatic: '🌊',
}

const CategoriesPage = () => {
  const items = Array.isArray(CATEGORIES) ? CATEGORIES : []

  return (
    <div className='min-h-screen'>
      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <motion.h1
          className='text-center text-3xl sm:text-4xl font-semibold text-emerald-300 mb-6'
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Categories
        </motion.h1>

        <motion.div
          className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4'
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          {items.map((name) => {
            const icon = ICONS[name] || name.charAt(0)
            return (
              <Link
                key={name}
                to={`/category/${encodeURIComponent(name)}`}
                className='group relative rounded-xl border border-white/10 bg-white/\[0.03] hover:bg-white/\[0.06] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 h-20 sm:h-24 px-3 sm:px-4 flex items-center gap-3'
              >
                <span className='inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/10 text-base sm:text-lg text-gray-200 group-hover:text-white'>
                  {icon}
                </span>
                <div className='flex-1 min-w-0'>
                  <div className='text-sm sm:text-base font-medium text-white truncate group-hover:text-emerald-200'>
                    {name}
                  </div>
                  <div className='text-[11px] sm:text-xs text-gray-400 truncate'>Explore {name.toLowerCase()}</div>
                </div>
                <span className='text-gray-500 group-hover:text-emerald-300 transition-colors'>→</span>
              </Link>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}

export default CategoriesPage
