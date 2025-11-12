import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB } from '../backend/lib/db.js';

// Routes
import authRoute from '../backend/routes/authRoute.js';
import productRoute from '../backend/routes/productRoute.js';
import cartRoute from '../backend/routes/cartRoute.js';
import paymentRoute from '../backend/routes/paymentRoute.js';
import couponRoute from '../backend/routes/couponRoute.js';
import analyticsRoute from '../backend/routes/analyticsRoute.js';
import orderRoute from '../backend/routes/orderRoute.js';
import customerRoute from '../backend/routes/customerRoute.js';

dotenv.config();

// Connect to database once
let dbConnected = false;
if (!dbConnected) {
  connectDB();
  dbConnected = true;
}

const app = express();

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// CORS headers for Vercel
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API routes
app.use('/api/auth', authRoute);
app.use('/api/products', productRoute);
app.use('/api/cart', cartRoute);
app.use('/api/payments', paymentRoute);
app.use('/api/coupons', couponRoute);
app.use('/api/analytics', analyticsRoute);
app.use('/api/orders', orderRoute);
app.use('/api/customers', customerRoute);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Export for Vercel
export default app;
