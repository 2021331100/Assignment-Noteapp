const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid resource ID format.' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ message: `Duplicate value for ${field}.` });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid JWT token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'JWT expired. Please log in again.' });
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error.' : err.message;

  if (process.env.NODE_ENV !== 'production') {
    console.error('Unhandled error:', err.stack);
  }

  return res.status(statusCode).json({ message });
};

module.exports = {
  notFound,
  errorHandler,
};
