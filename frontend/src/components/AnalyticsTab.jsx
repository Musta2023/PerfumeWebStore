import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "../lib/axios";
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, Calendar, Award } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const AnalyticsTab = () => {
  const [analyticsData, setAnalyticsData] = useState({
    users: 0,
    products: 0,
    totalSales: 0,
    totalRevenue: 0,
  });
  const [dailySalesData, setDailySalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [orderStatusStats, setOrderStatusStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [dateRange, setDateRange] = useState('7'); // 7, 30, 90 days

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const [analyticsRes, topProductsRes, ordersRes] = await Promise.all([
        axios.get("/analytics"),
        axios.get("/products"),
        axios.get("/orders?limit=1000"), // Get orders for status breakdown
      ]);

      setAnalyticsData(analyticsRes.data.analyticsData ?? {});
      setDailySalesData(Array.isArray(analyticsRes.data.dailySalesData) ? analyticsRes.data.dailySalesData : []);

      // Process top products (mock ranking by name for now - in production use sales data)
      const products = topProductsRes.data.products || [];
      const topProds = products.slice(0, 5).map((p, idx) => ({
        name: p.name,
        sales: Math.floor(Math.random() * 100) + 50, // Mock data - replace with real sales
        revenue: p.price * (Math.floor(Math.random() * 100) + 50),
      }));
      setTopProducts(topProds);

      // Process category stats
      const categoryMap = {};
      products.forEach(p => {
        if (p.category) {
          categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
        }
      });
      const catStats = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
      setCategoryStats(catStats);

      // Process order status stats
      const orders = ordersRes.data.orders || [];
      const statusMap = {};
      orders.forEach(o => {
        statusMap[o.status] = (statusMap[o.status] || 0) + 1;
      });
      const statusStats = Object.entries(statusMap).map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value 
      }));
      setOrderStatusStats(statusStats);

    } catch (err) {
      console.error("Error fetching analytics:", err);
      setApiError("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center text-gray-300 py-8">Loading analytics…</div>
    );
  }

  if (apiError) {
    return (
      <div className="text-center text-red-400 py-8">{apiError}</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex items-center justify-between bg-gray-900/40 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-300">
          <Calendar className="w-5 h-5" />
          <span className="font-medium">Date Range:</span>
        </div>
        <div className="flex gap-2">
          {['7', '30', '90'].map((days) => (
            <button
              key={days}
              onClick={() => setDateRange(days)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === days
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Last {days} days
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Users"
          value={Number(analyticsData.users || 0).toLocaleString()}
          icon={Users}
          change="+12%"
          gradientFrom="from-emerald-600"
          gradientTo="to-emerald-900"
        />
        <AnalyticsCard
          title="Total Products"
          value={Number(analyticsData.products || 0).toLocaleString()}
          icon={Package}
          change="+5%"
          gradientFrom="from-teal-600"
          gradientTo="to-teal-900"
        />
        <AnalyticsCard
          title="Total Sales"
          value={Number(analyticsData.totalSales || 0).toLocaleString()}
          icon={ShoppingCart}
          change="+23%"
          gradientFrom="from-cyan-600"
          gradientTo="to-cyan-900"
        />
        <AnalyticsCard
          title="Total Revenue"
          value={`$${Number(analyticsData.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          change="+18%"
          gradientFrom="from-lime-600"
          gradientTo="to-lime-900"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales & Revenue Line Chart */}
        <motion.div
          className="bg-gray-900/40 border border-gray-800 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Sales & Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#E5E7EB' }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="sales"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
                name="Sales"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Revenue ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Order Status Distribution */}
        <motion.div
          className="bg-gray-900/40 border border-gray-800 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            Order Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Second Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <motion.div
          className="bg-gray-900/40 border border-gray-800 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Top 5 Products
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#9CA3AF" fontSize={12} width={120} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Bar dataKey="sales" fill="#10B981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          className="bg-gray-900/40 border border-gray-800 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" />
            Products by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsTab;

/* ---- Subcomponent ---- */

const AnalyticsCard = ({ title, value, icon: Icon, change, gradientFrom, gradientTo }) => (
  <motion.div
    className="relative rounded-lg p-5 shadow-lg overflow-hidden bg-gray-900/40 border border-gray-800"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45 }}
    whileHover={{ scale: 1.02 }}
  >
    <div className="flex justify-between items-start relative z-10">
      <div className="flex-1">
        <p className="text-gray-400 text-xs mb-1 font-medium uppercase tracking-wide">{title}</p>
        <h3 className="text-white text-2xl font-bold mb-2">{value}</h3>
        {change && (
          <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className="p-3 rounded-lg bg-gray-800/50">
        <Icon className="h-6 w-6 text-emerald-400" />
      </div>
    </div>

    {/* Decorative gradient */}
    <div className={`absolute inset-0 bg-linear-to-br ${gradientFrom} ${gradientTo} opacity-5`} />
  </motion.div>
);
