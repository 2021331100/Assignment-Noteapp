require('dotenv').config();

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

const connectDB = async () => {
  mongoose.set('strictQuery', true);

  const configuredURI = process.env.MONGODB_URI || process.env.MONGO_URI;

  try {
    if (configuredURI) {
      await mongoose.connect(configuredURI, {
        autoIndex: true,
      });
      console.log('MongoDB connected successfully with configured URI.');
      return;
    }

    const localFallbackURI = 'mongodb://127.0.0.1:27017/note_app';
    await mongoose.connect(localFallbackURI, {
      autoIndex: true,
    });
    console.log('MongoDB connected successfully with local fallback URI.');
  } catch (error) {
    const message = error && error.message ? error.message : '';
    const shouldUseMemoryFallback = !configuredURI || /ENOTFOUND|ECONNREFUSED|ECONNRESET|querySrv|bad auth|authentication failed/i.test(message);

    if (!shouldUseMemoryFallback) {
      throw error;
    }

    if (!memoryServer) {
      memoryServer = await MongoMemoryServer.create({
        binary: {
          version: '7.0.14',
        },
        instance: {
          dbName: 'note_app',
        },
      });
    }

    const uri = memoryServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri, {
      autoIndex: true,
    });

    console.log('MongoDB connected successfully with in-memory fallback.');
  }
};

module.exports = connectDB;