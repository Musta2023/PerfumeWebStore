import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { connectDB } from './lib/db.js';

// Routes
import authRoute from './routes/authRoute.js';
import productRoute from './routes/productRoute.js';
import cartRoute from './routes/cartRoute.js';
import paymentRoute from './routes/paymentRoute.js';
import couponRoute from './routes/couponRoute.js';
import analyticsRoute from './routes/analyticsRoute.js';
import orderRoute from './routes/orderRoute.js';
import customerRoute from './routes/customerRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json());

// API routes
app.use('/api/auth', authRoute);
app.use('/api/products', productRoute);
app.use('/api/cart', cartRoute);
app.use('/api/payments', paymentRoute);
app.use('/api/coupons', couponRoute);
app.use('/api/analytics', analyticsRoute);
app.use('/api/orders', orderRoute);
app.use('/api/customers', customerRoute);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.resolve(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`server is running on: http://localhost:${PORT}`);
  connectDB();
});
