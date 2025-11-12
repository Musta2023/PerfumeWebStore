import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../lib/db.js';
import User from '../models/userModel.js';

dotenv.config();

async function listUsers() {
  try {
    await connectDB();
    
    const users = await User.find({}).select('name email role createdAt').lean();
    
    if (users.length === 0) {
      console.log('\n❌ No users found in database.');
      console.log('Please sign up first at http://localhost:5173/signup\n');
    } else {
      console.log('\n📋 Users in database:\n');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
      
      console.log(`\n✅ To promote a user to admin, run:`);
      console.log(`npm run seed:admin -- --email ${users[0].email}\n`);
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err?.message || err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
}

listUsers();
