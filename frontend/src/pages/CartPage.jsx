import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '../stores/useCartStore'
import OrderSummary from '../components/OrderSummary'

const CartPage = () => {
  const cart = useCartStore((s) => s.cart)
  const missingCartItems = useCartStore((s) => s.missingCartItems)
  const getCartItems = useCartStore((s) => s.getCartItems)
  const autoApplyFirstOrderCoupon = useCartStore((s) => s.autoApplyFirstOrderCoupon)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeFromCart = useCartStore((s) => s.removeFromCart)

  useEffect(() => {
    getCartItems().finally(() => {
      // After cart loads, attempt to auto-apply any eligible first-order coupon
      autoApplyFirstOrderCoupon()
    })
  }, [getCartItems, autoApplyFirstOrderCoupon])

  // What checkout will send right now (based on current store state)
  const checkoutPayload = useMemo(() => {
    const arr = Array.isArray(cart) ? cart : []
    return arr
      .map((it) => ({
        id: String(it._id || it.id || it.product || it.productId || ''),
        quantity: Number(it.quantity || 1),
      }))
      .filter((p) => p.id && Number.isFinite(p.quantity) && p.quantity > 0)
  }, [cart])

  return (
    <div className='py-8 md:py-16'>
      <div className='mx-auto max-w-7xl px-4 2xl:px-0'>
        <div className='mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8'>
          <motion.div
            className='mx-auto w-full flex-none lg:max-w-2xl xl:max-w-4xl'
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {cart.length === 0 && (!missingCartItems || missingCartItems.length === 0) ? (
              <EmptyCartUI />
            ) : (
              <div className='space-y-4'>
                {missingCartItems && missingCartItems.length > 0 && (
                  <div className='rounded-md border border-yellow-600/40 bg-yellow-500/10 p-3 text-sm text-yellow-300'>
                    Some items in your cart are no longer available and won’t be charged at checkout.
                  </div>
                )}
                {cart.map((item) => (
                  <div key={item._id} className='flex gap-3 border border-gray-700/50 rounded-lg p-3 bg-gray-900/40'>
                    <div className='w-24 h-24 bg-gray-800/60 rounded-md flex items-center justify-center text-gray-400 overflow-hidden'>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className='w-full h-full object-cover' />
                      ) : (
                        <span className='text-xs'>No image</span>
                      )}
                    </div>
                    <div className='flex-1'>
                      <div className='font-semibold'>{item.name}</div>
                      <div className='text-sm text-gray-400 line-clamp-2'>{item.description}</div>
                      <div className='mt-1 text-sm text-gray-300'>${Number(item.price || 0).toFixed(2)} each · ${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)} total</div>
                      <div className='mt-2 flex items-center gap-2'>
                        <button onClick={() => updateQuantity(item._id, Math.max(0, (item.quantity || 1) - 1))} className='px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700'>-</button>
                        <span className='min-w-8 text-center'>{item.quantity || 1}</span>
                        <button onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)} className='px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700'>+</button>
                        <button onClick={() => removeFromCart(item._id)} className='ml-3 text-red-400 hover:text-red-300 text-sm'>Remove</button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Render placeholders for missing items */}
                {missingCartItems && missingCartItems.length > 0 && (
                  <div className='space-y-2 mt-4'>
                    {missingCartItems.map((m) => (
                      <div key={m.id} className='flex gap-3 border border-red-800/40 rounded-lg p-3 bg-red-900/20 text-red-200'>
                        <div className='w-24 h-24 bg-red-900/30 rounded-md flex items-center justify-center'>N/A</div>
                        <div className='flex-1'>
                          <div className='font-semibold'>Item unavailable</div>
                          <div className='text-sm'>Product was removed from the store.</div>
                          <div className='mt-2 text-xs opacity-80'>Product ID: {m.id} • Qty: {m.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {(cart.length > 0) && (
            <motion.div
              className='mx-auto mt-6 max-w-4xl flex-1 space-y-6 lg:mt-0 lg:w-full'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <OrderSummary />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
export default CartPage

const EmptyCartUI = () => (
  <motion.div
    className='flex flex-col items-center justify-center space-y-4 py-16'
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <ShoppingCart className='h-24 w-24 text-gray-300' />
    <h3 className='text-2xl font-semibold '>Your cart is empty</h3>
    <p className='text-gray-400'>Looks like you haven't added anything to your cart yet.</p>
    <Link className='mt-4 rounded-md bg-emerald-500 px-6 py-2 text-white transition-colors hover:bg-emerald-600' to='/'>
      Start Shopping
    </Link>
  </motion.div>
)
