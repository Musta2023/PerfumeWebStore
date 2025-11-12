# ADMIN SYSTEM - Implementation Guide & Checklist

## ✅ COMPLETED CHANGES

### 1. Authentication & RBAC (✓ DONE)
- **Fixed**: LoginPage now uses `useUserStore.login()` instead of direct fetch
- **Fixed**: SignUpPage now uses `useUserStore.signup()` instead of direct fetch
- **Result**: Proper user state management, admin navigation now visible after login

### 2. Data Models (✓ DONE)
- **Added**: `status` field to Order model with enum values: `pending`, `processing`, `paid`, `shipped`, `delivered`, `cancelled`, `refunded`
- **Created**: AuditLog model for tracking all admin actions
- **Location**: `backend/models/auditLogModel.js`

### 3. Seed Scripts (✓ DONE)
- **Created**: `seedAll.js` - Comprehensive seed with:
  - Admin user promotion
  - 3 demo customers (Alice, Bob, Charlie)
  - 9 products across all fragrance families
  - 15 demo orders with various statuses
  - Demo coupons for customers
- **Command**: `npm run seed:all`
- **Also Created**: `listUsers.js` to view all users in database
- **Command**: `npm run list-users`

### 4. API Endpoints - Orders (✓ DONE)
- **Created**: `backend/controllers/orderController.js`
- **Created**: `backend/routes/orderRoute.js`
- **Endpoints**:
  - `GET /api/orders` - List orders with filters (status, customer, date range, search)
  - `GET /api/orders/:id` - Get single order details
  - `PATCH /api/orders/:id` - Update order status (logs audit trail)
  - `GET /api/orders/stats/summary` - Order statistics

### 5. API Endpoints - Customers (✓ DONE)
- **Created**: `backend/controllers/customerController.js`
- **Endpoints**:
  - `GET /api/customers` - List customers with order stats
  - `GET /api/customers/:id` - Get customer details + order history
  - `PATCH /api/customers/:id` - Update customer profile
  - `GET /api/customers/stats/summary` - Customer statistics

---

## 🚧 REMAINING TASKS

### CRITICAL - Wire Up Backend Routes
**Location**: `backend/server.js`

Add these import statements:
```javascript
import orderRoute from './routes/orderRoute.js';
import customerRoute from './routes/customerRoute.js';
```

Add these route handlers:
```javascript
app.use('/api/orders', orderRoute);
app.use('/api/customers', customerRoute);
```

### Task 1: Create Customer Routes File
**File**: `backend/routes/customerRoute.js`
```javascript
import express from 'express';
import { protectRoute, adminRoute } from '../middlewares/authMidlleware.js';
import {
	getAllCustomers,
	getCustomerById,
	updateCustomer,
	getCustomerStats,
} from '../controllers/customerController.js';

const router = express.Router();

router.get('/', protectRoute, adminRoute, getAllCustomers);
router.get('/stats/summary', protectRoute, adminRoute, getCustomerStats);
router.get('/:id', protectRoute, adminRoute, getCustomerById);
router.patch('/:id', protectRoute, adminRoute, updateCustomer);

export default router;
```

### Task 2: Enhance AdminPage with Orders Tab
**File**: `frontend/src/pages/AdminPage.jsx`

Add 'orders' and 'customers' tabs to the existing tabs array:
```javascript
const tabs = [
  { id: 'create', label: 'Create Product', icon: PlusCircle },
  { id: 'products', label: 'Products', icon: ShoppingBasket },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },      // ADD THIS
  { id: 'customers', label: 'Customers', icon: Users },      // ADD THIS
  { id: 'analytics', label: 'Analytics', icon: BarChart },
]
```

Add orders tab content (after analytics tab):
```javascript
{activeTab === 'orders' && (
  <OrdersTab />  // Create this component
)}

{activeTab === 'customers' && (
  <CustomersTab />  // Create this component
)}
```

### Task 3: Create OrdersTab Component
**File**: `frontend/src/components/OrdersTab.jsx`

```javascript
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
  const [filters, setFilters] = useState({ status: 'all', page: 1 });

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
      });
      const res = await fetch(`/api/orders?${params}`, { credentials: 'include' });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'pending', 'processing', 'paid', 'shipped', 'delivered'].map((status) => (
          <button
            key={status}
            onClick={() => setFilters({ ...filters, status, page: 1 })}
            className={`px-3 py-1 rounded text-sm ${
              filters.status === status
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {loading ? (
        <p className="text-gray-400">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-400">No orders found</p>
      ) : (
        <div className="overflow-x-auto border border-gray-700/50 rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800/70">
              <tr>
                <th className="px-3 py-2">Order ID</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b border-gray-700/40">
                  <td className="px-3 py-2 text-xs font-mono">{order._id.slice(-8)}</td>
                  <td className="px-3 py-2">
                    <div className="text-sm">{order.user?.name || 'N/A'}</div>
                    <div className="text-xs text-gray-400">{order.user?.email}</div>
                  </td>
                  <td className="px-3 py-2">{order.products?.length || 0}</td>
                  <td className="px-3 py-2 font-semibold text-emerald-400">
                    ${Number(order.totalAmount).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs border ${statusColors[order.status] || 'bg-gray-700 text-gray-300'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
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
      )}
    </div>
  );
};

export default OrdersTab;
```

### Task 4: Create CustomersTab Component
**File**: `frontend/src/components/CustomersTab.jsx`

```javascript
import { useState, useEffect } from 'react';

const CustomersTab = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: 1, limit: 50 });
      if (search) params.append('search', search);
      
      const res = await fetch(`/api/customers?${params}`, { credentials: 'include' });
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md bg-gray-800 border border-gray-700 rounded px-3 py-2"
      />

      {/* Customers Table */}
      {loading ? (
        <p className="text-gray-400">Loading customers...</p>
      ) : customers.length === 0 ? (
        <p className="text-gray-400">No customers found</p>
      ) : (
        <div className="overflow-x-auto border border-gray-700/50 rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800/70">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Orders</th>
                <th className="px-3 py-2">Total Spent</th>
                <th className="px-3 py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer._id} className="border-b border-gray-700/40">
                  <td className="px-3 py-2">{customer.name}</td>
                  <td className="px-3 py-2 text-gray-400">{customer.email}</td>
                  <td className="px-3 py-2">{customer.orderCount || 0}</td>
                  <td className="px-3 py-2 font-semibold text-emerald-400">
                    ${Number(customer.totalSpent || 0).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-400">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomersTab;
```

---

## 📋 VALIDATION CHECKLIST

### Step 1: Backend Setup
```powershell
# 1. Create customer routes file (see Task 1 above)
# 2. Wire up routes in server.js
# 3. Restart backend
npm run dev
```

### Step 2: Seed Demo Data
```powershell
# Run comprehensive seed
npm run seed:all
```

**Expected Output**:
- ✓ Admin user promoted/exists
- ✓ 3 customers created
- ✓ 9 products created
- ✓ 15 orders created
- ✓ Coupons created

### Step 3: Frontend Setup
```powershell
cd frontend
npm run dev
```

### Step 4: Login as Admin
1. Go to `http://localhost:5173/login`
2. Use admin email from seed output
3. After login, you should see **Dashboard** button in navbar

### Step 5: Validate Each Admin Section

#### ✅ Create Product Tab
- Fill form with all fields
- Click "Create Product"
- Should show success message
- Should clear form

#### ✅ Products Tab
- Should show list of all products
- Click star icon to toggle featured
- Click delete to remove product
- Should show confirmation dialog

#### ✅ Orders Tab (NEW)
- Should show list of orders
- Filter by status (all, pending, paid, etc.)
- Change order status via dropdown
- Should update immediately

#### ✅ Customers Tab (NEW)
- Should show list of customers
- Search by name or email
- Should show order count and total spent
- Data enriched from orders

#### ✅ Analytics Tab
- Should show:
  - Total Users
  - Total Products
  - Total Sales
  - Revenue
- No errors in console

### Step 6: Test API Endpoints Directly

```powershell
# Test orders endpoint
curl http://localhost:5000/api/orders -H "Cookie: accessToken=YOUR_TOKEN"

# Test customers endpoint
curl http://localhost:5000/api/customers -H "Cookie: accessToken=YOUR_TOKEN"

# Test order stats
curl http://localhost:5000/api/orders/stats/summary -H "Cookie: accessToken=YOUR_TOKEN"
```

---

## 🐛 KNOWN ISSUES & FIXES

### Issue 1: "Dashboard button not showing after login"
**Cause**: LoginPage/SignUpPage not updating user state
**Fix**: ✓ DONE - Both pages now use useUserStore

### Issue 2: "Orders have no status field"
**Cause**: Old orders in database
**Fix**: Run `npm run seed:all` to create orders with status

### Issue 3: "401 Unauthorized on admin endpoints"
**Cause**: Not logged in or not admin
**Fix**: 
1. Run `npm run seed:admin -- --email your@email.com`
2. Log out and log back in

### Issue 4: "Cannot find module orderRoute"
**Cause**: Routes not wired in server.js
**Fix**: Add imports and app.use() statements (see Critical task above)

---

## 🎯 FINAL DELIVERABLES STATUS

| Feature | Status | Notes |
|---------|--------|-------|
| Auth & RBAC | ✅ DONE | LoginPage/SignUpPage fixed |
| Order Model | ✅ DONE | Added status field |
| Audit Log Model | ✅ DONE | Tracks all admin actions |
| Seed Scripts | ✅ DONE | `npm run seed:all` |
| Orders API | ✅ DONE | Controller created, routes need wiring |
| Customers API | ✅ DONE | Controller created, routes need wiring |
| Orders UI | ⏳ TODO | Create OrdersTab component |
| Customers UI | ⏳ TODO | Create CustomersTab component |
| Wire Backend | ⏳ TODO | Add routes to server.js |
| Testing | ⏳ TODO | Validate all sections |

---

## 🚀 QUICK START COMMANDS

```powershell
# 1. Seed everything
npm run seed:all

# 2. Start backend
npm run dev

# 3. Start frontend (new terminal)
cd frontend
npm run dev

# 4. Check users
npm run list-users

# 5. Login at http://localhost:5173/login
# 6. Access dashboard at http://localhost:5173/dashboard
```

---

## 📝 NOTES

- All admin endpoints require `protectRoute` + `adminRoute` middleware
- Audit logs automatically created for order status changes and customer updates
- Cart 401 errors don't show toasts (as per requirements)
- Category 404s show "no products found" instead of error
- Fragrance families (not Men/Women/Unisex) used throughout
- All timestamps use business timezone (Africa/Casablanca) for analytics

---

## 🆘 TROUBLESHOOTING

**Problem**: Can't see dashboard after login
**Solution**: Clear browser cookies, ensure `npm run seed:admin` was run, log out and back in

**Problem**: Orders endpoint returns 404
**Solution**: Make sure routes are wired in `server.js`

**Problem**: No orders showing
**Solution**: Run `npm run seed:all` to create demo orders

**Problem**: Analytics shows 0 for everything
**Solution**: Orders need `status: 'paid'` - run seed script

---

For any issues, check:
1. Backend console for errors
2. Browser console (F12) for network errors
3. MongoDB connection string in `.env`
4. All required env vars present
