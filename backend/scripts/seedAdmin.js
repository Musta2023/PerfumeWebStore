import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../lib/db.js';
import User from '../models/userModel.js';

dotenv.config();

function parseEmailArg() {
  const args = process.argv.slice(2);
  // supports: --email foo@bar.com, -e foo@bar.com, --email=foo@bar.com
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--email' || a === '-e') return args[i + 1];
    const m = /^--email=(.+)$/i.exec(a);
    if (m) return m[1];
  }
  // fallback: first arg that looks like an email
  const guess = args.find((a) => /@/.test(a) && !a.startsWith('-'));
  return guess;
}

async function seedAdmin() {
  try {
    await connectDB();

    const argEmail = parseEmailArg();
    const targetEmail = (argEmail || process.env.ADMIN_EMAIL || '').toLowerCase().trim() || null;

    // If a specific email is provided, promote that user regardless of existing admins
    if (targetEmail) {
      const user = await User.findOne({ email: targetEmail });
      if (!user) {
        console.log(`No user found with email=${targetEmail}.`);
        await mongoose.disconnect();
        process.exit(1);
      }
      if (user.role === 'admin') {
        console.log(`User ${targetEmail} is already an admin.`);
      } else {
        user.role = 'admin';
        await user.save();
        console.log(`Promoted ${targetEmail} to admin.`);
      }
      await mongoose.disconnect();
      process.exit(0);
    }

    // No specific email provided: safe mode — only promote if no admin exists
    const adminExists = await User.exists({ role: 'admin' });
    if (adminExists) {
      console.log('Admin already exists. Nothing to do.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // fallback: promote the earliest created user
    const user = await User.findOne().sort({ createdAt: 1 });
    if (!user) {
      console.log('No users found in database. Create an account first, then re-run this script.');
      await mongoose.disconnect();
      process.exit(1);
    }
    console.log(`Promoting earliest user: ${user.email}`);
    user.role = 'admin';
    await user.save();

    console.log('User promoted to admin successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed admin failed:', err?.message || err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
}

seedAdmin();
