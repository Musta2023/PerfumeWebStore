import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../backend/models/productModel.js';
import User from '../backend/models/userModel.js';

function isMeaningful(s) {
  const v = String(s || '').trim();
  if (!v) return false;
  const lower = v.toLowerCase();
  // treat our previous placeholder as not meaningful
  if (lower === 'recovered item' || lower.startsWith('recovered item (sellable)')) return false;
  return true;
}

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGO;
  if (!uri) {
    console.error('MONGO_URI (or MONGO_URL) not set in environment');
    process.exit(1);
  }
  await mongoose.connect(uri);

  // Find placeholder-ish products (price <= 0 OR placeholder true OR inactive)
  const candidates = await Product.find({
    $or: [
      { price: { $lte: 0 } },
      { placeholder: true },
      { isActive: false },
    ],
  }).lean();

  let transformed = 0;
  let skipped = 0;

  for (const p of candidates) {
    // Only transform products referenced by at least one user's cart
    const refUser = await User.findOne({ 'cartItems.productId': p._id }).select('_id').lean();
    if (!refUser) {
      skipped++;
      continue;
    }

    const update = {};
    const old = {};

    // If it has non-positive price, set to 39.99
    if (p.price == null || Number(p.price) <= 0) {
      old.price = p.price;
      update.price = 39.99;
    }

    // If stock undefined or 0, set to 100 (may be ignored if schema is strict for saves; works via update)
    if (p.stock == null || Number(p.stock) === 0) {
      old.stock = p.stock;
      update.stock = 100;
    }

    // Ensure active
    if (p.isActive === false) {
      old.isActive = p.isActive;
      update.isActive = true;
    }

    // If placeholder field exists (or regardless, try to unset it)
    if (p.placeholder === true) {
      old.placeholder = p.placeholder;
      update.placeholder = false;
    }

    // Adjust name/description if not meaningful
    if (!isMeaningful(p.name)) {
      old.name = p.name;
      update.name = 'Recovered item (Sellable)';
    }
    if (!isMeaningful(p.description)) {
      old.description = p.description;
      update.description = 'Recovered product with restored pricing/availability.';
    }

    if (Object.keys(update).length === 0) {
      // Requirement: do NOT change products with valid positive price unless inactive.
      // At this point, nothing to change (either already valid or not referenced).
      skipped++;
      continue;
    }

    const res = await Product.updateOne({ _id: p._id }, { $set: update }, { strict: false });
    transformed += res.modifiedCount || 0;

    console.log(`activated ${p._id}:`, { old, update });
  }

  console.log(`\nSummary: transformed=${transformed}, skipped=${skipped}`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('activatePlaceholders failed:', e?.message || e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
