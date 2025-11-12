import { useEffect, useState } from 'react'
import { 
  BarChart, 
  PlusCircle, 
  ShoppingBasket, 
  ShoppingBag, 
  Users, 
  LayoutDashboard,
  ChevronRight,
  Menu,
  X,
  Home,
  Settings as SettingsIcon
} from 'lucide-react'
import { Link } from 'react-router-dom'
import OrdersTab from '../components/OrdersTab'
import CustomersTab from '../components/CustomersTab'
import AnalyticsTab from '../components/AnalyticsTab'
import CreateProductForm from '../components/CreateProductForm'
import ProductsList from '../components/ProductsList'
import SettingsTab from '../components/SettingsTab'
import { useProductStore } from '../stores/useProductStore'
import { useUserStore } from '../stores/useUserStore'

const navigationItems = [
  { id: 'analytics', label: 'Analytics', icon: BarChart, description: 'View store metrics and insights' },
  { id: 'create', label: 'Create Product', icon: PlusCircle, description: 'Add new products to store' },
  { id: 'products', label: 'Products', icon: ShoppingBasket, description: 'Manage product catalog' },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, description: 'Manage customer orders' },
  { id: 'customers', label: 'Customers', icon: Users, description: 'View and manage customers' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, description: 'Store configuration' },
]

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('analytics')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { fetchAllProducts } = useProductStore()
  const user = useUserStore((s) => s.user)

  useEffect(() => {
    if (activeTab === 'products') fetchAllProducts()
  }, [activeTab, fetchAllProducts])

  const activeItem = navigationItems.find(item => item.id === activeTab)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 z-30">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo/Title */}
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-6 h-6 text-emerald-400" />
              <h1 className="text-xl font-bold text-emerald-400">Admin Dashboard</h1>
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-sm text-gray-300"
            >
              <Home className="w-4 h-4" />
              <span>Back to Store</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <span className="hidden md:block text-sm text-gray-300">{user?.name || 'Admin'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-16 left-0 bottom-0 w-64 bg-gray-900/50 backdrop-blur-sm border-r border-gray-800 z-20 transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-emerald-400'
                  }`} />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{item.label}</div>
                    {!isActive && (
                      <div className="text-xs text-gray-500 group-hover:text-gray-400 hidden xl:block">
                        {item.description}
                      </div>
                    )}
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </button>
              )
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
            <div className="text-xs text-gray-500 text-center">
              <div className="font-semibold text-emerald-400">PerfumeStore</div>
              <div className="mt-1">Admin Panel v1.0</div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] overflow-y-auto">
          {/* Breadcrumbs */}
          <div className="sticky top-0 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 px-6 py-4 z-10">
            <div className="flex items-center gap-2 text-sm">
              <LayoutDashboard className="w-4 h-4 text-gray-500" />
              <span className="text-gray-500">Dashboard</span>
              <ChevronRight className="w-4 h-4 text-gray-600" />
              {activeItem && (
                <>
                  <activeItem.icon className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-medium">{activeItem.label}</span>
                </>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mt-2">{activeItem?.label || 'Dashboard'}</h2>
            <p className="text-sm text-gray-400 mt-1">{activeItem?.description}</p>
          </div>

          {/* Content area */}
          <div className="p-6">
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'create' && <CreateProductForm />}
            {activeTab === 'products' && <ProductsList />}
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'customers' && <CustomersTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </main>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default AdminPage
