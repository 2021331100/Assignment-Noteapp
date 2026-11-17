require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const validateEnvironment = require('./src/config/validateEnvironment');

const PORT = Number(process.env.PORT) || 3000;
const server = http.createServer(app);

let shuttingDown = false;

const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(JSON.stringify({ level: 'info', event: 'shutdown_started', signal }));

  const forceExit = setTimeout(() => {
    console.error(JSON.stringify({ level: 'error', event: 'shutdown_timeout' }));
    process.exit(1);
  }, 10000);
  forceExit.unref();

  server.close(async (error) => {
    if (error) {
      console.error(JSON.stringify({ level: 'error', event: 'http_shutdown_failed', message: error.message }));
      process.exitCode = 1;
    }
    try {
      await mongoose.disconnect();
      console.log(JSON.stringify({ level: 'info', event: 'shutdown_complete' }));
    } catch (disconnectError) {
      console.error(JSON.stringify({ level: 'error', event: 'database_shutdown_failed', message: disconnectError.message }));
      process.exitCode = 1;
    } finally {
      clearTimeout(forceExit);
      process.exit();
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

const start = async () => {
  validateEnvironment();
  await connectDB();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(JSON.stringify({ level: 'info', event: 'server_started', port: PORT }));
  });
};

start().catch((error) => {
  console.error(JSON.stringify({ level: 'fatal', event: 'startup_failed', message: error.message }));
  process.exit(1);
});
