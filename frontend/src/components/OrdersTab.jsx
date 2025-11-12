import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const statusColors = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-400',
  processing: 'bg-blue-500/20 text-blue-400 border-blue-400',
  paid: 'bg-green-500/20 text-green-400 border-green-400',
  shipped: 'bg-purple-500/20 text-purple-400 border-purple-400',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-400',
  cancelled: 'bg-red-500/20 text-red-400 border-red-400',
  refunded: 'bg-orange-500/20 text-orange-400 border-orange-400',
};

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ 
    status: 'all', 
    page: 1,
    search: '' 
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: filters.page,
        limit: 20,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      });
      const res = await fetch(`/api/orders?${params}`, { credentials: 'include' });
      const data = await res.json();
      setOrders(data.orders || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchOrders(); // Refresh list
      }
    } catch (err) {
      console.error('Failed to update order:', err);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput, page: 1 });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-semibold">Orders Management</h2>
        </div>
        
        {/* Search */}
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 pl-10 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilters({ ...filters, status, page: 1 })}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filters.status === status
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          <p className="text-gray-400 mt-2">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/40 rounded-lg border border-gray-700/50">
          <p className="text-gray-400 text-lg">No orders found</p>
          <p className="text-gray-500 text-sm mt-2">
            {filters.search ? 'Try a different search term' : 'Orders will appear here once customers place them'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-700/50 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-800/70">
                <tr>
                  <th className="px-3 py-3 font-semibold">Order ID</th>
                  <th className="px-3 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 font-semibold">Name</th>
                  <th className="px-3 py-3 font-semibold">Phone</th>
                  <th className="px-3 py-3 font-semibold">Address</th>
                  <th className="px-3 py-3 font-semibold">Items</th>
                  <th className="px-3 py-3 font-semibold">Products</th>
                  <th className="px-3 py-3 font-semibold">Total</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-700/40 hover:bg-gray-800/30">
                    <td className="px-3 py-3">
                      <span className="font-mono text-xs bg-gray-800 px-2 py-1 rounded">
                        {order._id.slice(-8)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium">{order.user?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-400">{order.user?.email}</div>
                    </td>
                    <td className="px-3 py-3">{order.deliveryName || '—'}</td>
                    <td className="px-3 py-3 text-xs">{order.deliveryPhone || '—'}</td>
                    <td className="px-3 py-3 text-xs text-gray-400">
                      <div className="line-clamp-1" title={order.deliveryAddress || ''}>
                        {order.deliveryAddress || '—'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="bg-gray-800 px-2 py-1 rounded text-xs">
                        {order.products?.length || 0}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {(() => {
                        const count = order.products?.length || 0;
                        const first = order.products?.[0]?.product?.name;
                        if (!first) return '—';
                        return count > 1 ? `${first} +${count - 1} more` : first;
                      })()}
                    </td>
                    <td className="px-3 py-3 font-semibold text-emerald-400">
                      ${Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded text-xs border font-medium ${
                        statusColors[order.status] || 'bg-gray-700 text-gray-300'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="paid">Paid</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-400">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total orders)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: Math.min(pagination.pages, filters.page + 1) })}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default OrdersTab;
