import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from '../lib/axios';
import { 
  Store, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  DollarSign,
  Truck,
  CreditCard,
  Bell,
  Shield,
  Save,
  RefreshCw,
  Star,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useProductStore } from '../stores/useProductStore';

const SettingsTab = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { products, fetchAllProducts } = useProductStore();
  
  // Store Settings
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'PerfumeStore',
    email: 'contact@perfumestore.com',
    phone: '+1 (555) 123-4567',
    address: '123 Fragrance Avenue, New York, NY 10001',
    website: 'https://perfumestore.com',
    currency: 'USD',
    taxRate: '8.5',
    shippingFee: '9.99',
    freeShippingThreshold: '75',
  });

  // Featured Products Management
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  // Notification Settings
  const [notifications, setNotifications] = useState({
    orderNotifications: true,
    lowStockAlerts: true,
    newCustomerAlerts: false,
    dailyReports: false,
  });

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  useEffect(() => {
    if (products && products.length > 0) {
      const featured = products.filter(p => p.isFeatured);
      const available = products.filter(p => !p.isFeatured);
      setFeaturedProducts(featured);
      setAvailableProducts(available);
    }
  }, [products]);

  const handleStoreSettingChange = (field, value) => {
    setStoreSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // In production, save to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeaturedProduct = async (productId) => {
    try {
      await axios.patch(`/products/updateProduct/${productId}`);
      await fetchAllProducts(); // Refresh products list
      toast.success('Featured product updated');
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Store Information */}
      <motion.div
        className="bg-gray-900/40 border border-gray-800 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-600/20 rounded-lg">
            <Store className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Store Information</h3>
            <p className="text-sm text-gray-400">Manage your store's basic information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Store className="w-4 h-4 inline mr-1" />
              Store Name
            </label>
            <input
              type="text"
              value={storeSettings.storeName}
              onChange={(e) => handleStoreSettingChange('storeName', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={storeSettings.email}
              onChange={(e) => handleStoreSettingChange('email', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone
            </label>
            <input
              type="tel"
              value={storeSettings.phone}
              onChange={(e) => handleStoreSettingChange('phone', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Website
            </label>
            <input
              type="url"
              value={storeSettings.website}
              onChange={(e) => handleStoreSettingChange('website', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Address
            </label>
            <input
              type="text"
              value={storeSettings.address}
              onChange={(e) => handleStoreSettingChange('address', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </motion.div>

      {/* Financial Settings */}
      <motion.div
        className="bg-gray-900/40 border border-gray-800 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <DollarSign className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Financial Settings</h3>
            <p className="text-sm text-gray-400">Configure pricing and payment options</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <CreditCard className="w-4 h-4 inline mr-1" />
              Currency
            </label>
            <select
              value={storeSettings.currency}
              onChange={(e) => handleStoreSettingChange('currency', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={storeSettings.taxRate}
              onChange={(e) => handleStoreSettingChange('taxRate', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Truck className="w-4 h-4 inline mr-1" />
              Shipping Fee ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={storeSettings.shippingFee}
              onChange={(e) => handleStoreSettingChange('shippingFee', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Free Shipping ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={storeSettings.freeShippingThreshold}
              onChange={(e) => handleStoreSettingChange('freeShippingThreshold', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </motion.div>

      {/* Featured Products Management */}
      <motion.div
        className="bg-gray-900/40 border border-gray-800 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-600/20 rounded-lg">
            <Star className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Featured Products</h3>
            <p className="text-sm text-gray-400">Manage products displayed on homepage</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Featured Products */}
          <div>
            <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Currently Featured ({featuredProducts.length})
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {featuredProducts.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No featured products</p>
              ) : (
                featuredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div>
                        <p className="text-white text-sm font-medium">{product.name}</p>
                        <p className="text-gray-400 text-xs">${product.price}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFeaturedProduct(product._id)}
                      className="px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Products */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Available Products ({availableProducts.length})
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableProducts.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">All products are featured</p>
              ) : (
                availableProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div>
                        <p className="text-white text-sm font-medium">{product.name}</p>
                        <p className="text-gray-400 text-xs">${product.price}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFeaturedProduct(product._id)}
                      className="px-3 py-1 bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600/30 transition-colors text-sm"
                    >
                      Feature
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        className="bg-gray-900/40 border border-gray-800 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <Bell className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Notification Preferences</h3>
            <p className="text-sm text-gray-400">Choose what notifications you want to receive</p>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div>
                <p className="text-white font-medium">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </p>
                <p className="text-gray-400 text-sm">
                  {key === 'orderNotifications' && 'Get notified when new orders are placed'}
                  {key === 'lowStockAlerts' && 'Receive alerts when products are running low'}
                  {key === 'newCustomerAlerts' && 'Get notified about new customer registrations'}
                  {key === 'dailyReports' && 'Receive daily sales and analytics reports'}
                </p>
              </div>
              <button
                onClick={() => handleNotificationChange(key)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  value ? 'bg-emerald-600' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                    value ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        className="flex justify-end gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </motion.div>
    </div>
  );
};

export default SettingsTab;
