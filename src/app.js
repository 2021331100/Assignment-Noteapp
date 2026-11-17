require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

const proxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS || '0', 10);
if (!Number.isInteger(proxyHops) || proxyHops < 0) {
  throw new Error('TRUST_PROXY_HOPS must be a non-negative integer.');
}
app.set('trust proxy', proxyHops);
app.disable('x-powered-by');

const allowedOrigins = (process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('CORS_ORIGIN must contain the exact frontend origin in production.');
}

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    console.log(JSON.stringify({
      level: 'info',
      event: 'http_request',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    }));
  });
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.get('/health', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  return res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ok' : 'unavailable',
    database: databaseReady ? 'connected' : 'disconnected',
  });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' },
});

app.use('/api/auth', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', userRoutes);

app.use(express.static(path.join(__dirname, '../public')));

app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') return next();
  return res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
