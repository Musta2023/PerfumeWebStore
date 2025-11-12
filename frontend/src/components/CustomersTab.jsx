import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, ChevronLeft, ChevronRight, DollarSign, ShoppingBag } from 'lucide-react';

const CustomersTab = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCustomers();
  }, [search, page]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        page: page, 
        limit: 20,
        ...(search && { search }),
      });
      
      const res = await fetch(`/api/customers?${params}`, { credentials: 'include' });
      const data = await res.json();
      setCustomers(data.customers || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
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
          <Users className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-semibold">Customers Management</h2>
        </div>
        
        {/* Search */}
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
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

      {/* Summary Stats */}
      {!loading && customers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Users className="w-4 h-4" />
              <span>Total Customers</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">{pagination.total}</div>
          </div>
          <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span>Total Orders</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {customers.reduce((sum, c) => sum + (c.orderCount || 0), 0)}
            </div>
          </div>
          <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              <span>Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              ${customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Customers Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          <p className="text-gray-400 mt-2">Loading customers...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/40 rounded-lg border border-gray-700/50">
          <p className="text-gray-400 text-lg">No customers found</p>
          <p className="text-gray-500 text-sm mt-2">
            {search ? 'Try a different search term' : 'Customers will appear here once they sign up'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-700/50 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-800/70">
                <tr>
                  <th className="px-3 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 font-semibold">Email</th>
                  <th className="px-3 py-3 font-semibold text-center">Orders</th>
                  <th className="px-3 py-3 font-semibold text-right">Total Spent</th>
                  <th className="px-3 py-3 font-semibold">Joined</th>
                  <th className="px-3 py-3 font-semibold">Role</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id} className="border-b border-gray-700/40 hover:bg-gray-800/30">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-400/40 flex items-center justify-center">
                          <span className="text-emerald-300 font-semibold text-sm">
                            {customer.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'NA'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-xs text-gray-400">ID: {customer._id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-300">{customer.email}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="bg-gray-800 px-2 py-1 rounded text-xs font-medium">
                        {customer.orderCount || 0}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-400">
                      ${Number(customer.totalSpent || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-400">
                      {new Date(customer.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        customer.role === 'admin' 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40' 
                          : 'bg-gray-700/50 text-gray-300'
                      }`}>
                        {customer.role}
                      </span>
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
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total customers)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
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

export default CustomersTab;
