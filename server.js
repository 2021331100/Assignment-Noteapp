require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const createDefaultAdmin = require('./src/config/seedAdmin');

const PORT = process.env.PORT || 3000;

connectDB()
  .then(async () => {
    await createDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  });
