import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../lib/db.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import Coupon from '../models/couponModel.js';

dotenv.config();

const PRODUCTS = [
  { name: 'Bloom Essence', description: 'A bouquet of jasmine and rose with soft musk.', price: 89, category: 'Floral', image: 'https://picsum.photos/seed/bloom-essence/800/600', isFeatured: true },
  { name: 'Cedar Trail', description: 'Warm cedarwood and amber with a hint of leather.', price: 99, category: 'Woody', image: 'https://picsum.photos/seed/cedar-trail/800/600', isFeatured: true },
  { name: 'Citrus Spark', description: 'Zesty lemon and bergamot over crisp greens.', price: 79, category: 'Citrus', image: 'https://picsum.photos/seed/citrus-spark/800/600', isFeatured: true },
  { name: 'Saffron Ember', description: 'Spiced saffron and vanilla; rich and intoxicating.', price: 119, category: 'Oriental', image: 'https://picsum.photos/seed/saffron-ember/800/600', isFeatured: false },
  { name: 'Ocean Mist', description: 'Sea breeze, driftwood, and mineral freshness.', price: 85, category: 'Aquatic', image: 'https://picsum.photos/seed/ocean-mist/800/600', isFeatured: false },
  { name: 'Green Breeze', description: 'Herbal greens and dewy leaves with soft florals.', price: 82, category: 'Fresh', image: 'https://picsum.photos/seed/green-breeze/800/600', isFeatured: false },
  { name: 'Berry Muse', description: 'Juicy berries and delicate peony with vanilla.', price: 88, category: 'Fruity', image: 'https://picsum.photos/seed/berry-muse/800/600', isFeatured: false },
  { name: 'Vanilla Crème', description: 'Gourmand vanilla, caramel, and tonka bean.', price: 95, category: 'Gourmand', image: 'https://picsum.photos/seed/vanilla-creme/800/600', isFeatured: true },
  { name: 'Spiced Noir', description: 'Cardamom, pepper, and dark woods for depth.', price: 105, category: 'Spicy', image: 'https://picsum.photos/seed/spiced-noir/800/600', isFeatured: false },
];

const DEMO_CUSTOMERS = [
  { name: 'Alice Johnson', email: 'alice@example.com', password: 'password123' },
  { name: 'Bob Smith', email: 'bob@example.com', password: 'password123' },
  { name: 'Charlie Davis', email: 'charlie@example.com', password: 'password123' },
];

async function seedAll() {
  try {
    await connectDB();
    console.log('\n🌱 Starting comprehensive seed...\n');

    // 1. Clear existing data (optional - comment out to preserve)
    console.log('📦 Clearing existing data...');
    await Promise.all([
      Order.deleteMany({}),
      Product.deleteMany({}),
    ]);

    // 2. Ensure admin user exists
    console.log('👤 Ensuring admin user...');
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.findOne().sort({ createdAt: 1 });
      if (admin) {
        admin.role = 'admin';
        await admin.save();
        console.log(`   ✓ Promoted ${admin.email} to admin`);
      } else {
        console.log('   ⚠️  No users found. Please sign up first.');
        process.exit(1);
      }
    } else {
      console.log(`   ✓ Admin exists: ${admin.email}`);
    }

    // 3. Create demo customers
    console.log('👥 Creating demo customers...');
    const customers = [];
    for (const customerData of DEMO_CUSTOMERS) {
      let customer = await User.findOne({ email: customerData.email });
      if (!customer) {
        customer = await User.create(customerData);
        console.log(`   ✓ Created customer: ${customer.email}`);
      } else {
        console.log(`   ⏭️  Customer exists: ${customer.email}`);
      }
      customers.push(customer);
    }

    // 4. Create products
    console.log('🧴 Creating products...');
    const createdProducts = [];
    for (const prod of PRODUCTS) {
      const existing = await Product.findOne({ name: prod.name });
      if (existing) {
        await Product.updateOne({ _id: existing._id }, { $set: prod });
        createdProducts.push(existing);
        console.log(`   ✓ Updated: ${prod.name}`);
      } else {
        const newProd = await Product.create(prod);
        createdProducts.push(newProd);
        console.log(`   ✓ Created: ${prod.name}`);
      }
    }

    // 5. Create demo orders
    console.log('📋 Creating demo orders...');
    const orderStatuses = ['paid', 'processing', 'shipped', 'delivered', 'pending'];
    const ordersToCreate = [];

    for (let i = 0; i < 15; i++) {
      const customer = customers[i % customers.length];
      const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
      const productsInOrder = [];
      let totalAmount = 0;

      for (let j = 0; j < numItems; j++) {
        const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 qty
        const price = product.price;
        
        productsInOrder.push({
          product: product._id,
          quantity,
          price,
        });
        totalAmount += price * quantity;
      }

      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      
      // Create orders with staggered dates (last 30 days)
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      ordersToCreate.push({
        user: customer._id,
        products: productsInOrder,
        totalAmount,
        status,
        stripeSessionId: `demo_session_${i}_${Date.now()}`,
        createdAt,
      });
    }

    const orders = await Order.insertMany(ordersToCreate);
    console.log(`   ✓ Created ${orders.length} demo orders`);

    // 6. Create demo coupons
    console.log('🎫 Creating demo coupons...');
    for (const customer of customers) {
      const existing = await Coupon.findOne({ userId: customer._id });
      if (!existing) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);
        
        await Coupon.create({
          code: `SAVE${Math.floor(Math.random() * 90 + 10)}`,
          discountPercentage: 10,
          expirationDate,
          isActive: true,
          userId: customer._id,
        });
        console.log(`   ✓ Created coupon for ${customer.email}`);
      }
    }

    console.log('\n✅ Seed completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Admin: ${admin.email}`);
    console.log(`   - Customers: ${customers.length}`);
    console.log(`   - Products: ${createdProducts.length}`);
    console.log(`   - Orders: ${orders.length}`);
    console.log(`\n🚀 You can now:`)
    console.log(`   1. Login as admin: ${admin.email}`);
    console.log(`   2. View dashboard at /dashboard`);
    console.log(`   3. Manage products, orders, and customers\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err?.message || err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
}

seedAll();
