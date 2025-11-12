import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingCart,
  UserPlus,
  LogIn,
  LogOut,
  Lock,
  Home,
  Menu,
  X,
  User as UserIcon,
  ListOrdered,
} from 'lucide-react'
import { useUserStore } from '../stores/useUserStore'
import { useCartStore } from '../stores/useCartStore'

const Navbar = () => {
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const user = useUserStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const cart = useCartStore((s) => s.cart)
  const cartCount = Array.isArray(cart)
    ? cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
    : 0
  const initials = user?.name
    ? user.name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()
    : (user?.email ? user.email[0].toUpperCase() : '')

  // close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!userMenuRef.current) return
      if (!userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="fixed top-0 left-0 w-full bg-linear-120-to-r from-gray-900 via-gray-900 to-gray-800 backdrop-blur-xl border-b border-gray-700/50 shadow-2xl z-50">
      {/* Full width; no container gutter so right edge is truly flush */}
      <nav className="relative w-full px-0 py-3 flex items-center justify-between">
        {/* Logo (kept same look; slightly smaller on mobile) */}
        <Link
          to="/"
          className="pl-4 md:pl-5 group relative text-xl md:text-2xl font-semibold text-transparent bg-clip-text bg-linear-120-to-r from-green-400 to-emerald-500 tracking-tight transition-all duration-300 hover:scale-105"
        >
          PerfumeStore
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-linear-120-to-r from-green-400 to-emerald-500 group-hover:w-full transition-all duration-300"></span>
        </Link>

        {/* Mobile menu toggle (shows on < md) */}
        <button
          onClick={() => setOpen((s) => !s)}
          className="md:hidden flex items-center justify-center mr-2 p-2 text-gray-300 hover:text-green-400"
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Desktop nav: absolute, flush right; hidden on mobile */}
        <div className="hidden md:flex absolute top-3 right-2 items-center space-x-5 text-gray-300 text-sm">
          <Link
            to="/"
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-800/50 transition-all duration-300 hover:text-green-400"
          >
            <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-medium">Home</span>
          </Link>

          {user && (
            <Link
              to="/orders"
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-800/50 transition-all duration-300 hover:text-green-400"
            >
              <ListOrdered className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Orders</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/dashboard"
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-linear-0-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 hover:border-amber-400/60 transition-all duration-300 hover:shadow-md hover:shadow-amber-500/20"
            >
              <Lock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium text-amber-400">Dashboard</span>
              <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">Admin</span>
            </Link>
          )}

          <Link
            to="/cart"
            className="relative group flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-linear-0-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all duration-300 shadow-md shadow-green-900/30 hover:shadow-green-500/40 hover:scale-105"
          >
            <ShoppingCart className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-semibold text-white">Cart</span>

            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-green-400 text-gray-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md shadow-green-500/40">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((s) => !s)}
                className="flex items-center gap-2 pl-1 pr-2 rounded-md hover:bg-gray-800/60 transition-colors"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <div className="w-7 h-7 rounded-full bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-xs font-bold">
                  {initials}
                </div>
                <span className="hidden md:block max-w-[160px] truncate text-gray-200">{user.name || user.email}</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-700/50 bg-gray-900/95 backdrop-blur-xl shadow-2xl p-1.5">
                  <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-700/50">
                    Signed in as
                    <div className="text-emerald-300 truncate">{user.email || user.name}</div>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800/60 text-gray-200"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <UserIcon className="w-4 h-4" /> Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800/60 text-gray-200"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <ListOrdered className="w-4 h-4" /> Orders
                  </Link>
                  <Link
                    to="/logout"
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800/60 text-gray-200"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/signup"
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-linear-120-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:border-green-400/50 transition-all duration-300 hover:shadow-md hover:shadow-green-500/20"
              >
                <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium text-green-400">Sign Up</span>
              </Link>
              <Link
                to="/login"
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-800/50 transition-all duration-300 hover:text-green-400"
              >
                <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                <span className="font-medium">Log In</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile nav panel: slides under the header, right-aligned */}
        {open && (
          <div className="md:hidden absolute top-full right-0 mt-2 mr-2 w-[88vw] max-w-xs rounded-lg border border-gray-700/50 bg-gray-900/95 backdrop-blur-xl shadow-2xl p-3 text-gray-200">
            <div className="flex flex-col gap-2 text-base">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="group flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-800/60 transition-all"
              >
                <span className="flex items-center gap-2">
                  <Home className="w-5 h-5" /> Home
                </span>
              </Link>

              {user ? (
                <div className="flex flex-col gap-1 px-2 py-2">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-7 h-7 rounded-full bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-xs font-bold">
                      {initials}
                    </div>
                    <span className="text-gray-200 max-w-[180px] truncate">{user.name || user.email}</span>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-800/60 transition-all"
                  >
                    <span className="flex items-center gap-2"><UserIcon className="w-5 h-5" /> Profile</span>
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-800/60 transition-all"
                  >
                    <span className="flex items-center gap-2"><ListOrdered className="w-5 h-5" /> Orders</span>
                  </Link>
                  <Link
                    to="/logout"
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-800/60 transition-all"
                  >
                    <span className="flex items-center gap-2"><LogOut className="w-5 h-5" /> Log Out</span>
                  </Link>
                </div>
              ) : (
                <>
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between px-3 py-2 rounded-md bg-linear-120-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:border-green-400/50 transition-all"
                  >
                    <span className="flex items-center gap-2 text-green-400">
                      <UserPlus className="w-5 h-5" /> Sign Up
                    </span>
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-800/60 transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <LogIn className="w-5 h-5" /> Log In
                    </span>
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="group flex items-center justify-between px-3 py-2 rounded-md bg-linear-120-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 hover:border-amber-400/60 transition-all"
                >
                  <span className="flex items-center gap-2 text-amber-400">
                    <Lock className="w-5 h-5" /> Dashboard
                    <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">Admin</span>
                  </span>
                </Link>
              )}

              <Link
                to="/cart"
                onClick={() => setOpen(false)}
                className="relative group flex items-center justify-between px-3 py-2 rounded-md bg-linear-120-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all shadow-md shadow-green-900/30"
              >
                <span className="flex items-center gap-2 text-white">
                  <ShoppingCart className="w-5 h-5" /> Cart
                </span>
                {cartCount > 0 && (
                  <span className="ml-2 bg-white/90 text-gray-900 text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center shadow">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar
