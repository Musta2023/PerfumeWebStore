import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../backend/models/userModel.js';
import Product from '../backend/models/productModel.js';

// Simple slugify and normalizers (no external deps)
const normalizeName = (s) => (s || '').toString().trim().toLowerCase();
const slugify = (s) => normalizeName(s)
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');
const escapeRegExp = (s) => (s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGO;
  if (!uri) {
    console.error('MONGO_URI (or MONGO_URL) not set in environment');
    process.exit(1);
  }

  await mongoose.connect(uri);

  // Preload all products for local matching
  const products = await Product.find({}).select('_id name').lean();
  const foundSet = new Set(products.map((p) => String(p._id)));
  const byName = new Map(); // normalized name -> product
  const bySlug = new Map(); // slug -> product
  for (const p of products) {
    const nm = normalizeName(p.name);
    const sl = slugify(p.name);
    if (nm && !byName.has(nm)) byName.set(nm, p);
    if (sl && !bySlug.has(sl)) bySlug.set(sl, p);
  }

  const users = await User.find({ role: 'customer', cartItems: { $exists: true, $ne: [] } });

  let usersFixed = 0;
  let itemsRemapped = 0;
  let placeholdersCreated = 0;
  let itemsRemoved = 0;

  const usePlaceholders = /^true$/i.test(String(process.env.PLACEHOLDERS || ''));

  for (const user of users) {
    let changed = false;
    const items = Array.isArray(user.cartItems) ? user.cartItems : [];

    for (let i = 0; i < items.length; i++) {
      const entry = items[i];
      const oldId = (entry && typeof entry === 'object' && entry.productId)
        ? String(entry.productId)
        : String(entry);
      const qty = (entry && typeof entry === 'object') ? Number(entry.quantity || 1) : 1;

      if (!oldId) continue;
      if (foundSet.has(oldId)) continue; // product still exists

      // Try to infer product by name or slug if present on the entry
      const candidateName = (entry && typeof entry === 'object' && (entry.name || entry.productName))
        ? String(entry.name || entry.productName)
        : '';
      const candidateSlug = (entry && typeof entry === 'object' && entry.slug)
        ? String(entry.slug)
        : (candidateName ? slugify(candidateName) : '');

      let mapped = null;
      if (candidateName) {
        const nm = normalizeName(candidateName);
        mapped = byName.get(nm) || null;
      }
      if (!mapped && candidateSlug) {
        const sl = slugify(candidateSlug);
        mapped = bySlug.get(sl) || null;
      }
      // Fallback: strict case-insensitive match if not in the pre-index
      if (!mapped && candidateName) {
        const rx = new RegExp(`^${escapeRegExp(candidateName)}$`, 'i');
        const hit = await Product.findOne({ name: rx }).select('_id name').lean();
        if (hit) {
          mapped = hit;
          const nm = normalizeName(hit.name);
          const sl = slugify(hit.name);
          if (nm && !byName.has(nm)) byName.set(nm, hit);
          if (sl && !bySlug.has(sl)) bySlug.set(sl, hit);
          foundSet.add(String(hit._id));
        }
      }

      if (mapped) {
        // Replace old productId with new product _id, keep/normalize structure
        if (entry && typeof entry === 'object') {
          entry.productId = mapped._id;
          entry.quantity = qty > 0 ? qty : 1;
        } else {
          items[i] = { productId: mapped._id, quantity: qty > 0 ? qty : 1 };
        }
        console.log(`mapped ${oldId} -> ${String(mapped._id)} (${mapped.name}) for ${user.email}`);
        itemsRemapped++;
        changed = true;
      } else if (usePlaceholders) {
        // Create placeholder product with same _id when possible
        try {
          const canUseId = mongoose.Types.ObjectId.isValid(oldId);
          const placeholderDoc = canUseId
            ? { _id: new mongoose.Types.ObjectId(oldId) }
            : {};
          const placeholder = await Product.create({
            ...placeholderDoc,
            name: 'Recovered item',
            description: 'Recovered from missing product reference',
            price: 0,
            image: 'https://picsum.photos/seed/recovered/800/600',
            category: 'Recovered',
            isActive: true,
          });
          foundSet.add(String(placeholder._id));
          if (entry && typeof entry === 'object') {
            entry.productId = placeholder._id;
            entry.quantity = qty > 0 ? qty : 1;
          } else {
            items[i] = { productId: placeholder._id, quantity: qty > 0 ? qty : 1 };
          }
          placeholdersCreated++;
          changed = true;
          console.log(`placeholder for ${oldId} -> ${String(placeholder._id)} (Recovered item) for ${user.email}`);
        } catch (e) {
          // If placeholder creation fails, remove the item
          items.splice(i, 1);
          i--;
          itemsRemoved++;
          console.log(`removed unmapped productId ${oldId} for ${user.email} (placeholder creation failed)`);
          changed = true;
        }
      } else {
        // Remove the item if no match and placeholders disabled
        items.splice(i, 1);
        i--;
        itemsRemoved++;
        console.log(`unmapped productId ${oldId} for ${user.email}`);
        changed = true;
      }
    }

    if (changed) {
      // Ensure normalized structure
      user.cartItems = items.map((it) => (
        it && typeof it === 'object' && it.productId ? { productId: it.productId, quantity: Number(it.quantity || 1) } : { productId: it, quantity: 1 }
      ));
      await user.save();
      usersFixed++;
    }
  }

  console.log(`\nSummary: users fixed=${usersFixed}, items remapped=${itemsRemapped}, placeholders created=${placeholdersCreated}, items removed=${itemsRemoved}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Migration failed:', err?.message || err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
