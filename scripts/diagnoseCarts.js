import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../backend/models/userModel.js';
import Product from '../backend/models/productModel.js';

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGO;
  if (!uri) {
    console.error('MONGO_URI (or MONGO_URL) not set in environment');
    process.exit(1);
  }
  await mongoose.connect(uri);

  const productsCount = await Product.countDocuments({});
  const sample = await Product.find({}).select('_id name').limit(5).lean();
  console.log(`Products count: ${productsCount}`);
  console.log('Sample products:', sample.map((p) => ({ _id: p._id, name: p.name })));

  const users = await User.find({ cartItems: { $exists: true, $ne: [] } }).select('email cartItems').lean();
  let usersWithMissing = 0;
  let totalMissing = 0;

  // Build set of existing product IDs
  const allIds = new Set();
  for (const u of users) {
    for (const it of (u.cartItems || [])) {
      const id = (it && typeof it === 'object' && it.productId) ? String(it.productId) : String(it);
      if (id) allIds.add(id);
    }
  }
  const existing = await Product.find({ _id: { $in: Array.from(allIds) } }).select('_id').lean();
  const existSet = new Set(existing.map((p) => String(p._id)));

  console.log('\nUser cart diagnostics:');
  console.log('user | totalItems | missing [id:qty, ...]');

  for (const u of users) {
    const items = (u.cartItems || []).map((i) => ({
      id: (i && typeof i === 'object' && i.productId) ? String(i.productId) : String(i),
      qty: Number(i?.quantity || 1),
    }));
    const missing = items.filter((x) => !existSet.has(x.id));
    if (missing.length > 0) {
      usersWithMissing++;
      totalMissing += missing.length;
    }
    const missingStr = missing.map((m) => `${m.id}:${m.qty}`).join(', ');
    console.log(`${u.email} | ${items.length} | [${missingStr}]`);
  }

  console.log(`\nSummary: users scanned=${users.length}, users with missing=${usersWithMissing}, missing items=${totalMissing}`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('Diagnosis failed:', e?.message || e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});