import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../lib/db.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';

dotenv.config();

async function main() {
  const shouldPrune = process.argv.includes('--prune');
  await connectDB();

  const users = await User.find({}).select('email cartItems').lean();
  let usersWithMissing = 0;
  let totalMissingRefs = 0;

  for (const u of users) {
    const items = (u.cartItems || []).map((i) => ({
      productId: i?.productId?.toString?.() || String(i?.productId || i),
      quantity: Number(i?.quantity || 1),
    }));
    const ids = items.map((i) => i.productId).filter(Boolean);
    if (ids.length === 0) continue;

    const products = await Product.find({ _id: { $in: ids } }).select('_id').lean();
    const foundSet = new Set(products.map((p) => String(p._id)));
    const missing = items.filter((i) => !foundSet.has(i.productId));

    if (missing.length > 0) {
      usersWithMissing++;
      totalMissingRefs += missing.length;
      console.log(`- ${u.email}: missing ${missing.length} cart refs`, missing.map((m) => m.productId));

      if (shouldPrune) {
        const pruned = items.filter((i) => foundSet.has(i.productId)).map((i) => ({ productId: i.productId, quantity: i.quantity }));
        await User.updateOne({ _id: u._id }, { $set: { cartItems: pruned } });
        console.log(`  pruned -> kept ${pruned.length}`);
      }
    }
  }

  console.log(`\nDone. Users with missing refs: ${usersWithMissing}. Total missing refs: ${totalMissingRefs}.`);
  if (!shouldPrune) console.log('Run with --prune to remove missing references.');

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('fixCarts failed:', e?.message || e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
