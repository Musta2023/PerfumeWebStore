# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a full-stack e-commerce perfume store application with AI capabilities. The project uses a monorepo structure with separate frontend (React + Vite) and backend (Node.js + Express) applications.

**Tech Stack:**
- **Frontend**: React 18, Vite, React Router, Zustand (state management), TailwindCSS, Framer Motion
- **Backend**: Express 5, MongoDB (Mongoose), Redis (Upstash), JWT authentication
- **Payment**: Stripe integration
- **Media**: Cloudinary for image management
- **Styling**: TailwindCSS 4.x with Vite plugin

## Development Commands

### Backend Server
```powershell
# Development with auto-reload
npm run dev

# Production start
npm start
```

Backend runs on `http://localhost:5000`

### Frontend Development
```powershell
# Navigate to frontend directory
cd frontend

# Start Vite dev server (with HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

Frontend dev server runs on `http://localhost:5173` with API proxy to backend

### Database Seeding
```powershell
# Seed demo products (9 perfumes across all categories)
npm run seed:products

# Promote a user to admin role
npm run seed:admin

# Promote specific user by email
npm run seed:admin -- --email user@example.com
```

## Architecture

### Authentication System

**Token Strategy**: Dual-token system with refresh token rotation
- **Access Token**: 15-minute expiry, stored in httpOnly cookie
- **Refresh Token**: 7-day expiry, stored in httpOnly cookie with JTI (unique token ID) stored in Redis
- **Token Rotation**: On refresh, old refresh token is revoked and new pair is issued
- **Automatic Refresh**: Frontend axios interceptor handles 401 responses by attempting token refresh

**Key Files:**
- `backend/controllers/authController.js` - Token generation, rotation, and auth logic
- `backend/middlewares/authMidlleware.js` - `protectRoute` and `adminRoute` guards
- `frontend/src/stores/useUserStore.jsx` - Auth state management with axios interceptors (lines 78-113)

### State Management (Zustand)

Frontend uses Zustand stores for global state:
- **useUserStore** (`frontend/src/stores/useUserStore.jsx`) - Authentication, user profile
- **useCartStore** (`frontend/src/stores/useCartStore.jsx`) - Cart items, totals, coupon application
- **useProductStore** - Product catalog management

### Category System

Product categories are based on fragrance families defined in `frontend/src/constants/categories.js`:
- Floral, Woody, Citrus, Oriental, Fresh, Fruity, Spicy, Gourmand, Aquatic

This constant is shared between frontend and backend for consistency.

### API Structure

**Routes:**
- `/api/auth` - signup, login, logout, refresh-token, profile
- `/api/products` - CRUD operations (admin), featured products, category filtering, recommendations
- `/api/cart` - cart management (requires authentication)
- `/api/payments` - Stripe checkout session creation and success handling
- `/api/coupons` - coupon validation and management
- `/api/analytics` - admin analytics endpoints

**Key Patterns:**
- Admin routes require both `protectRoute` and `adminRoute` middleware
- Cart operations gracefully handle 401 (unauthenticated) without showing error toasts
- Category 404s are treated as empty product lists (no error toast)

### Environment Configuration

**Backend** requires `.env` at project root:
```
MONGO_URL=mongodb://...
JWT_SECRET=...
UPSTASH_REDIS_URL=...
STRIPE_SECRET_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PORT=5000
NODE_ENV=development
```

**Frontend** requires `.env` in `frontend/`:
- Uses Vite proxy in development to avoid CORS (configured in `frontend/vite.config.js`)
- All API calls go through `/api` which proxies to `http://localhost:5000` in dev

### Data Models

**User** (`backend/models/userModel.js`):
- Fields: name, email, password (bcrypt hashed), role (customer|admin), cartItems (embedded cart)
- Pre-save hook auto-hashes passwords
- Method: `comparePassword(password)`

**Product** (`backend/models/productModel.js`):
- Fields: name, description, price, image, category, isFeatured, isActive
- Timestamps: createdAt, updatedAt

**Order, Coupon**: See `backend/models/` for schemas

### Frontend Routing

**Public Routes:**
- `/` - Home page with category browsing
- `/category/:categoryName` - Category-filtered products
- `/featured` - All featured products
- `/signup`, `/login` - Authentication pages

**Protected Routes:**
- `/cart` - Shopping cart (requires login)
- `/profile` - User profile
- `/orders` - Order history
- `/purchase-success`, `/purchase-cancel` - Post-checkout pages

**Admin Routes:**
- `/dashboard`, `/secret-dashboard` - Admin panel (requires admin role)

Route protection is handled in `frontend/src/App.jsx` using conditional rendering with `<Navigate>`.

## Development Notes

### Working with Products

- Products must use one of the 9 defined categories from `CATEGORIES` constant
- Image URLs can be Cloudinary URLs or placeholders (seeding uses picsum.photos)
- Featured products appear on home page and `/featured` route
- Admin can toggle `isFeatured` status via PATCH `/api/products/updateProduct/:productId`

### Cart Behavior

- Cart is embedded in User model (`cartItems` array with quantity and productId)
- Backend cart endpoints require authentication
- Frontend silently handles 401 on cart operations (clears local cart state)
- Cart calculations include coupon discounts if applied

### Payment Flow

1. User initiates checkout → `POST /api/payments/create-checkout-session`
2. Backend creates Stripe session with line items from cart
3. User completes payment on Stripe hosted page
4. Success: redirects to `/purchase-success` → `POST /api/payments/checkout-success`
5. Backend creates Order, clears cart, potentially creates coupon for user
### Code Quality

- Uses ES modules (`"type": "module"` in package.json)
- ESLint configured for frontend (`npm run lint` in frontend dir)
- Consistent async/await error handling in controllers
- Frontend uses react-hot-toast for user notifications

### Testing

No test framework is currently configured. When adding tests:
- Check for existing test patterns in the codebase first
- Backend: Consider Jest or Mocha + Chai for API testing
- Frontend: Consider Vitest (Vite-native) or React Testing Library

## Component and Page Architecture

### Page Flow and Components

#### HomePage (`pages/HomePage.jsx`)
**Purpose**: Landing page with category navigation, featured products carousel, and recommendations

**Data Flow**:
- Fetches from `/api/products/featured` on mount
- Fetches from `/api/products/recommendations` on mount
- Uses `CATEGORIES` constant from `constants/categories.js`

**Components Used**:
- `FeaturedProducts` - Carousel for featured products with "View all" link to `/featured`
- Renders category cards inline (links to `/category/:categoryName`)
- Renders recommended products inline

**Key Features**:
- 404 on featured endpoint is treated as empty list (no error)
- Category cards use fragrance family names from shared constant

#### CategoryPage (`pages/CategoryPage.jsx`)
**Purpose**: Display all products in a specific category

**Data Flow**:
- Reads `:categoryName` from URL params
- Fetches from `/api/products/category/:categoryName`
- 404 responses treated as empty category (shows "No products found" with back button)

**Behavior**:
- Non-404 errors show error message
- Empty category shows friendly CTA to return home
- Products rendered inline (not using ProductCard component)

#### FeaturedPage (`pages/FeaturedPage.jsx`)
**Purpose**: Display all featured products in a grid

**Data Flow**:
- Fetches from `/api/products/featured` on mount
- Renders products in grid layout inline

#### CartPage (`pages/CartPage.jsx`)
**Purpose**: Shopping cart management with recommendations

**Data Flow**:
- Fetches from `/api/cart` (requires auth)
- Fetches from `/api/products/recommendations` for "People also bought"
- Makes direct API calls (does NOT use `useCartStore` for fetching)

**Key Operations**:
- `updateQuantity(id, qty)` - PUT to `/api/cart/:id`
- `removeItem(id)` - calls `updateQuantity(id, 0)`
- `clearCart()` - DELETE to `/api/cart`
- `addToCart(productId)` - POST to `/api/cart`

**Components**:
- Renders cart items inline (not using CartItem component)
- Shows EmptyCartUI when cart is empty
- Renders recommendations inline with "Add to Cart" buttons
- Shows order summary inline (not using OrderSummary component)

**Note**: This page does NOT use Zustand stores - it manages its own state

#### AdminPage (`pages/AdminPage.jsx`)
**Purpose**: Admin dashboard with tabs for Create, Products, Analytics

**Data Flow**:
- Create: POST to `/api/products/createProduct`
- Products: GET from `/api/products/All` (admin-only endpoint)
- Analytics: GET from `/api/analytics`
- Toggle Featured: PATCH to `/api/products/updateProduct/:productId`
- Delete: DELETE to `/api/products/:productId`

**Components**:
- Tab-based UI with inline forms and tables
- Does NOT use `CreateProductForm`, `ProductsList`, or `AnalyticsTab` components
- Renders everything inline

**Admin Actions**:
- Create product with name, description, price, category, image
- Toggle featured status (shows star icon)
- Delete products (requires confirmation)
- View analytics: users, products, totalSales, totalRevenue

#### LoginPage & SignUpPage
**Purpose**: Authentication pages

**Data Flow**:
- LoginPage: POST to `/api/auth/login`
- SignUpPage: POST to `/api/auth/signup`
- Both include `credentials: 'include'` for cookie auth
- Navigate to `/` on success

**Features**:
- Password visibility toggle
- Client-side validation (SignUpPage)
- API error display
- Loading states
- Links to each other

### Standalone Components

#### FeaturedProducts (`components/FeaturedProducts.jsx`)
**Purpose**: Responsive carousel for featured products

**Props**:
- `featuredProducts` - Array of product objects
- `showViewAll` - Boolean to show "View all" link to `/featured`

**Features**:
- Responsive: 1 item (mobile), 2 (tablet), 3 (desktop), 4 (large screens)
- Keyboard navigation (arrow keys)
- Touch swipe support
- Previous/Next buttons
- Integrates with `useCartStore` for "Add to Cart"

**Used By**: HomePage

#### ProductCard (`components/ProductCard.jsx`)
**Purpose**: Reusable product display card

**Props**:
- `product` - Product object with name, description, price, image

**Features**:
- "Add to Cart" button using `useCartStore.addToCart()`
- Currency formatting (USD)
- Image with hover scale effect

**Currently NOT used by** any pages (CategoryPage, FeaturedPage, CartPage render inline)

#### CartItem (`components/CartItem.jsx`)
**Purpose**: Individual cart item with quantity controls

**Props**:
- `item` - Cart item object

**Features**:
- Quantity increment/decrement with stock limits
- Remove button
- Line total calculation
- Uses `useCartStore.updateQuantity()` and `useCartStore.removeFromCart()`

**Currently NOT used** by CartPage (renders inline)

#### OrderSummary (`components/OrderSummary.jsx`)
**Purpose**: Checkout summary with Stripe integration

**Features**:
- Shows subtotal, savings, coupon discount, total
- "Proceed to Checkout" button creates Stripe session
- Calls `POST /payments/create-checkout-session`
- Uses `@stripe/stripe-js` with `VITE_STRIPE_PUBLIC_KEY` env var
- Requires `useCartStore` state: `total`, `subtotal`, `coupon`, `isCouponApplied`, `cart`

**Currently NOT used** by CartPage (renders inline summary)

#### Navbar (`components/Navbar.jsx`)
**Purpose**: Main navigation with auth state

**Features**:
- Displays cart count badge from `useCartStore`
- User menu dropdown with Profile, Orders, Logout links
- Admin dashboard link (only if `user.role === 'admin'`)
- Mobile responsive menu
- Shows user initials in avatar circle

**Links**:
- `/` - Home
- `/dashboard` or `/secret-dashboard` - Admin (both go to AdminPage)
- `/cart` - Cart
- `/profile` - ProfilePage
- `/orders` - OrdersPage
- `/logout` - LogoutPage
- `/signup` - SignUpPage
- `/login` - LoginPage

**Used By**: App.jsx (rendered on every page)

#### CreateProductForm, ProductsList, AnalyticsTab
**Status**: These components exist but are NOT currently used
- AdminPage implements all functionality inline
- Safe to delete or refactor AdminPage to use them

### Critical Integration Points

#### Zustand Store Usage

**useUserStore** (`stores/useUserStore.jsx`):
- Used by: Navbar, App.jsx, all protected routes
- Methods: `signup()`, `login()`, `logout()`, `checkAuth()`, `refreshToken()`
- Axios interceptor (lines 78-113) automatically handles 401 → token refresh
- State: `user`, `loading`, `checkingAuth`

**useCartStore** (`stores/useCartStore.jsx`):
- Used by: Navbar (cart count), FeaturedProducts, ProductCard, CartItem, OrderSummary
- **NOT used by**: CartPage (manages its own state)
- Methods: `getCartItems()`, `addToCart()`, `removeFromCart()`, `updateQuantity()`, `clearCart()`
- Coupon methods: `getMyCoupon()`, `applyCoupon()`, `removeCoupon()`
- State: `cart`, `coupon`, `total`, `subtotal`, `isCouponApplied`

**useProductStore** (`stores/useProductStore.jsx`):
- Used by: CreateProductForm, ProductsList
- **NOT used by**: AdminPage (makes direct fetch calls)
- Should contain: `createProduct()`, `deleteProduct()`, `toggleFeaturedProduct()`, `products`

#### Missing Components on Pages

Several pages render UI inline instead of using existing components:

1. **CartPage** should use:
   - `CartItem` for each cart item
   - `OrderSummary` for checkout summary
   - Consider using `useCartStore` instead of local state

2. **CategoryPage & FeaturedPage** should use:
   - `ProductCard` for product display

3. **AdminPage** could use:
   - `CreateProductForm` for product creation tab
   - `ProductsList` for products tab
   - `AnalyticsTab` for analytics tab

#### Environment Variables

**Frontend** (`.env` in `frontend/`):
```
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```
Used by: OrderSummary component

### Recommended Refactoring

To make all components work correctly together:

1. **Refactor CartPage** to use existing components:
   ```jsx
   import CartItem from '../components/CartItem'
   import OrderSummary from '../components/OrderSummary'
   import { useCartStore } from '../stores/useCartStore'
   ```
   - Use `useCartStore.getCartItems()` instead of local fetch
   - Map cart items to `<CartItem>` components
   - Replace inline summary with `<OrderSummary />`

2. **Refactor CategoryPage and FeaturedPage** to use ProductCard:
   ```jsx
   import ProductCard from '../components/ProductCard'
   ```
   - Map products to `<ProductCard product={p} />` components

3. **Refactor AdminPage** to use admin components:
   ```jsx
   import CreateProductForm from '../components/CreateProductForm'
   import ProductsList from '../components/ProductsList'
   import AnalyticsTab from '../components/AnalyticsTab'
   ```
   - Use `useProductStore` for state management
   - Render components in respective tabs

4. **Add "Add to Cart" buttons** to CategoryPage and FeaturedPage products:
   - Either use ProductCard component (has button built-in)
   - Or import `useCartStore` and add buttons inline

### Development Workflow

When adding new features:

1. **Adding a new product field**:
   - Update `backend/models/productModel.js`
   - Update `backend/controllers/productController.js` (createProduct)
   - Update `frontend/src/components/CreateProductForm.jsx` or AdminPage form
   - Update all product display components (ProductCard, etc.)

2. **Adding a new page**:
   - Create page in `frontend/src/pages/`
   - Add route in `frontend/src/App.jsx`
   - Add navigation link in `Navbar.jsx` if needed
   - Ensure proper auth guards (`user ?` checks)

3. **Adding a new API endpoint**:
   - Add route in `backend/routes/`
   - Add controller in `backend/controllers/`
   - Add middleware if auth required (`protectRoute`, `adminRoute`)
   - Update relevant Zustand store or component to call it

4. **Adding authentication to a page**:
   - Wrap route in App.jsx: `element={user ? <Page /> : <Navigate to='/login' />}`
   - Or for admin: `element={user?.role === 'admin' ? <Page /> : <Navigate to='/login' />}`

## Admin System

### Admin Access

**Becoming an Admin**:
```powershell
# Promote existing user to admin
npm run seed:admin -- --email your@email.com

# Or promote first user automatically
npm run seed:admin

# List all users in database
npm run list-users
```

**Admin Features**:
- Full product CRUD with image management
- Order management with status updates
- Customer management with order history
- Analytics dashboard with KPIs
- Audit logging for all admin actions

### Admin API Endpoints

**Orders** (`/api/orders` - Admin only):
- `GET /` - List all orders with filters (status, customer, date range, search), pagination
- `GET /:id` - Get single order with customer and product details
- `PATCH /:id` - Update order status (creates audit log)
- `GET /stats/summary` - Order statistics (total, by status, revenue)

**Customers** (`/api/customers` - Admin only):
- `GET /` - List all customers with order stats (orderCount, totalSpent)
- `GET /:id` - Get customer details with full order history
- `PATCH /:id` - Update customer profile (name, email, role)
- `GET /stats/summary` - Customer statistics (total, top customers)

**Products** (existing, enhanced):
- `GET /All` - Admin-only product list
- `POST /createProduct` - Create product with image upload to Cloudinary
- `PATCH /updateProduct/:id` - Toggle featured status
- `DELETE /:id` - Delete product

**Analytics** (existing):
- `GET /api/analytics` - Overall statistics (users, products, sales, revenue)

### Admin Dashboard Tabs

The AdminPage (`/dashboard` or `/secret-dashboard`) has multiple tabs:

1. **Create Product**: Form to add new products
   - Fields: name, description, price, category, image URL/Base64
   - Categories must be fragrance families
   - Image uploaded to Cloudinary if Base64 provided

2. **Products**: Manage existing products
   - List all products in table
   - Toggle featured status (star icon)
   - Delete products with confirmation

3. **Orders**: Manage customer orders (see ADMIN_IMPLEMENTATION_GUIDE.md for full UI)
   - List orders with filters (status: pending, processing, paid, shipped, delivered)
   - Search by order ID or session ID
   - Update order status via dropdown
   - View customer info and order totals

4. **Customers**: Manage users (see ADMIN_IMPLEMENTATION_GUIDE.md for full UI)
   - List all customers
   - Search by name or email
   - View order count and lifetime value
   - Edit customer profiles

5. **Analytics**: Dashboard statistics
   - Total users, products, sales, revenue
   - Charts for revenue over time (if implemented)

### Audit Logging

**Model**: `backend/models/auditLogModel.js`

**Automatically logged actions**:
- Order status changes (who changed what, old vs new status)
- Customer profile updates (field-level changes)
- Product feature toggles
- Product creation/deletion (if wired)

**Audit Log Schema**:
```javascript
{
  actor: ObjectId,              // Admin user who performed action
  actorEmail: String,           // Email for easy lookup
  action: String,               // create, update, delete, status_change, etc.
  entity: String,               // product, order, customer, etc.
  entityId: String,             // ID of affected entity
  changes: Object,              // { field: { old: value, new: value } }
  metadata: Object,             // Additional context
  ipAddress: String,
  userAgent: String,
  createdAt: Date
}
```

### Seeding Demo Data

**Command**: `npm run seed:all`

**Creates**:
- Promotes first user to admin (or creates admin if ADMIN_EMAIL in .env)
- 3 demo customers: Alice, Bob, Charlie (password: `password123`)
- 9 products across all 9 fragrance families
- 15 demo orders with various statuses (pending, paid, shipped, etc.)
- Orders distributed over last 30 days for realistic analytics
- Demo coupons for each customer

**Note**: This script clears existing orders and products before seeding.

### Order Status Flow

Valid order statuses (enum in Order model):
1. `pending` - Order created, payment not confirmed
2. `processing` - Payment received, preparing shipment
3. `paid` - Payment confirmed (used for revenue analytics)
4. `shipped` - Order dispatched
5. `delivered` - Order received by customer
6. `cancelled` - Order cancelled
7. `refunded` - Payment refunded

Admin can change status via dropdown in Orders tab or API.

### Security Notes

- All admin endpoints protected by `protectRoute` + `adminRoute` middleware
- Role checked on both client (UI hiding) and server (enforcement)
- JWT token with 15-minute expiry, refresh token with 7-day expiry
- Refresh token rotation on each refresh (old token invalidated)
- Audit logs capture actor, timestamp, and changes for accountability
- Customer passwords never exposed in responses (`.select('-password')`)
