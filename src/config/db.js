const mongoose = require('mongoose');

const connectDB = async () => {
  mongoose.set('strictQuery', true);

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required. Refusing to start without a persistent database.');
  }

  await mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== 'production',
    serverSelectionTimeoutMS: 10000,
  });

  console.log(JSON.stringify({ level: 'info', event: 'database_connected' }));
};

module.exports = connectDB;
