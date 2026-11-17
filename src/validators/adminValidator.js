const AppError = require('../utils/AppError');

const validateAdminCreateUser = (req, res, next) => {
  const { name, email, password, role, interests } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return next(new AppError('Name is required and must be at least 2 characters long.', 400));
  }

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return next(new AppError('A valid email is required.', 400));
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long.', 400));
  }

  if (role !== undefined && !['user', 'admin'].includes(role)) {
    return next(new AppError('Role must be either user or admin.', 400));
  }

  if (interests !== undefined && (!Array.isArray(interests) || interests.some((interest) => typeof interest !== 'string' || !interest.trim()))) {
    return next(new AppError('Interests must be an array of non-empty strings.', 400));
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  return next();
};

const validateAdminUpdateUser = (req, res, next) => {
  const { name, email, role, password, interests } = req.body;

  if (Object.keys(req.body).length === 0) {
    return next(new AppError('At least one field is required to update the user.', 400));
  }

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    return next(new AppError('Name must be at least 2 characters long.', 400));
  }

  if (email !== undefined && (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim()))) {
    return next(new AppError('A valid email is required.', 400));
  }

  if (password !== undefined && (typeof password !== 'string' || password.length < 6)) {
    return next(new AppError('Password must be at least 6 characters long.', 400));
  }

  if (role !== undefined && !['user', 'admin'].includes(role)) {
    return next(new AppError('Role must be either user or admin.', 400));
  }

  if (interests !== undefined && (!Array.isArray(interests) || interests.some((interest) => typeof interest !== 'string' || !interest.trim()))) {
    return next(new AppError('Interests must be an array of non-empty strings.', 400));
  }

  if (name !== undefined) req.body.name = name.trim();
  if (email !== undefined) req.body.email = email.trim().toLowerCase();

  return next();
};

module.exports = {
  validateAdminCreateUser,
  validateAdminUpdateUser,
};
