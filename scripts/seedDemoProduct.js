import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../backend/models/productModel.js';

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGO;
  if (!uri) {
    console.error('MONGO_URI (or MONGO_URL) not set in environment');
    process.exit(1);
  }
  await mongoose.connect(uri);

  const doc = await Product.create({
    name: 'Demo Tester',
    description: 'Demo product for cart debugging',
    price: 1,
    image: 'https://picsum.photos/seed/demo-tester/800/600',
    category: 'Fresh',
    isActive: true,
  });

  console.log('Inserted demo product with _id:', String(doc._id));
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('seedDemoProduct failed:', e?.message || e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
