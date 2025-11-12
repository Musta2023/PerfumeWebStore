import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../lib/db.js';
import Product from '../models/productModel.js';

dotenv.config();

const samples = [
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

async function seedProducts() {
  try {
    await connectDB();

    for (const s of samples) {
      const existing = await Product.findOne({ name: s.name });
      if (existing) {
        await Product.updateOne({ _id: existing._id }, { $set: s });
        console.log(`Updated: ${s.name}`);
      } else {
        await Product.create(s);
        console.log(`Created: ${s.name}`);
      }
    }

    console.log('Seed products completed.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed products failed:', err?.message || err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
}

seedProducts();
