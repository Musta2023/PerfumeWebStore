import { useEffect, useState } from "react";
import axios from "../lib/axios";

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-400",
  processing: "bg-blue-500/20 text-blue-400 border-blue-400",
  paid: "bg-green-500/20 text-green-400 border-green-400",
  shipped: "bg-purple-500/20 text-purple-400 border-purple-400",
  delivered: "bg-emerald-500/20 text-emerald-400 border-emerald-400",
  cancelled: "bg-red-500/20 text-red-400 border-red-400",
  refunded: "bg-orange-500/20 text-orange-400 border-orange-400",
};

const statusLabels = {
  pending: "Pending",
  processing: "In process",
  paid: "Paid",
  shipped: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Orders | PerfumeStore";
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get("/orders/my");
        setOrders(res.data?.orders || []);
      } catch (err) {
        console.error("Failed to load orders", err);
        setError(err.response?.data?.message || "Failed to load your orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-emerald-400 mb-6">Your Orders</h1>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          <p className="text-gray-400 mt-2">Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/40 rounded-lg border border-gray-700/50">
          <p className="text-gray-300 text-lg">You don't have any orders yet.</p>
          <p className="text-gray-500 text-sm mt-2">When you place an order, it will show up here with its current status.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-gray-900/50 border border-gray-700/60 rounded-lg p-4">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded text-xs border font-medium ${statusColors[order.status] || "bg-gray-800 text-gray-300"}`}>
{statusLabels[order.status] || order.status}
                  </div>
                  <div className="text-xs text-gray-400">
                    Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </div>
                </div>
                <div className="text-sm text-gray-300">
                  <span className="text-gray-400">Order ID:</span>{" "}
                  <span className="font-mono bg-gray-800 px-2 py-0.5 rounded">
                    {order._id.slice(-8)}
                  </span>
                </div>
              </div>

              {/* Products */}
              <div className="mt-4 divide-y divide-gray-700/50">
                {order.products?.map((item) => (
                  <div key={item._id || item.product?._id} className="py-3 flex items-center gap-3">
                    <img
                      src={item.product?.image}
                      alt={item.product?.name}
                      className="w-14 h-14 rounded object-cover border border-gray-700/60"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.product?.name}</div>
                      <div className="text-xs text-gray-400">Qty: {item.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-300">${Number(item.price).toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Subtotal ${(Number(item.price) * Number(item.quantity || 1)).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer / totals */}
              <div className="mt-3 flex items-center justify-between text-sm">
                <div className="text-gray-400">Items: {order.products?.length || 0}</div>
                <div className="font-semibold text-emerald-400">Total: ${Number(order.totalAmount || order.amounts?.total || 0).toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
