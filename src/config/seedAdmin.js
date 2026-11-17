const User = require('../models/User');

const createDefaultAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminName = process.env.ADMIN_NAME || 'Admin User';

  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin';
      await existingAdmin.save();
    }

    console.log(`Admin account ready: ${adminEmail}`);
    return existingAdmin;
  }

  const admin = await User.create({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
    interests: ['coding', 'security'],
  });

  console.log(`Default admin created: ${admin.email}`);
  return admin;
};

module.exports = createDefaultAdmin;
