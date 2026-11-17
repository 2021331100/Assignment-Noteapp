const jwt = require('jsonwebtoken');

const User = require('../models/User');
const AppError = require('../utils/AppError');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Missing JWT token. Please log in.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new AppError('User no longer exists. Please log in again.', 401));
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('JWT expired. Please log in again.', 401));
    }

    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid JWT token.', 401));
    }

    return next(error);
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    const freshUser = await User.findById(req.user._id).select('-password');

    if (!freshUser) {
      return next(new AppError('User not found.', 401));
    }

    if (freshUser.role !== 'admin') {
      return next(new AppError('Forbidden: admin access required.', 403));
    }

    req.user = freshUser;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  protect,
  requireAdmin,
};
