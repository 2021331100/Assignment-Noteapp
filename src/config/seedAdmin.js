const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('./db');

const createAdmin = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running npm run seed:admin.');
  }
  if (ADMIN_PASSWORD.length < 12 || ADMIN_PASSWORD === 'Admin@123') {
    throw new Error('ADMIN_PASSWORD must be a unique password with at least 12 characters.');
  }

  await connectDB();

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role !== 'admin') {
      throw new Error('That email already belongs to a non-admin user. Choose a separate admin email.');
    }
    console.log(JSON.stringify({ level: 'info', event: 'admin_already_exists', email }));
    return;
  }

  const admin = await User.create({
    name: ADMIN_NAME || 'Admin',
    email,
    password: ADMIN_PASSWORD,
    role: 'admin',
    interests: ['coding', 'security'],
  });

  console.log(JSON.stringify({ level: 'info', event: 'admin_created', email: admin.email }));
};

if (require.main === module) {
  createAdmin()
    .catch((error) => {
      console.error(JSON.stringify({ level: 'error', event: 'admin_seed_failed', message: error.message }));
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
    });
}

module.exports = createAdmin;
