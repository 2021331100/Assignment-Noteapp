require('dotenv').config();

const mongoose = require('mongoose');
const readline = require('readline');
const User = require('./src/models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createAdmin() {
  try {
    const mongoURI =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      process.env.DATABASE_URL;

    if (!mongoURI) {
      throw new Error('MongoDB connection string not found in .env');
    }

    await mongoose.connect(mongoURI);
    console.log('MongoDB connected!');

    rl.question('Enter admin name: ', async (name) => {
      rl.question('Enter admin email: ', async (email) => {
        rl.question('Enter new admin password: ', async (password) => {
          try {
            const existingUser = await User.findOne({ email });

            if (existingUser) {
              console.log('This email already exists!');
              return;
            }

            const admin = await User.create({
              name,
              email,
              password,
              role: 'admin',
              interests: ['coding', 'reading']
            });

            console.log('Admin created successfully!');
            console.log('Email:', admin.email);
            console.log('Role:', admin.role);
          } catch (error) {
            console.log(error.message);
          } finally {
            rl.close();
            await mongoose.disconnect();
          }
        });
      });
    });
  } catch (error) {
    console.log('Error:', error.message);
    rl.close();
    await mongoose.disconnect();
  }
}

createAdmin();