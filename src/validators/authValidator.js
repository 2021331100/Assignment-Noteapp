const AppError = require('../utils/AppError');

const normalizeInterests = (interests) => {
  if (!interests) {
    return [];
  }

  if (!Array.isArray(interests)) {
    throw new AppError('Interests must be an array of strings.', 400);
  }

  return interests
    .map((interest) => String(interest).trim())
    .filter(Boolean);
};

const validateRegister = (req, res, next) => {
  try {
    const { name, email, password, interests, role } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return next(new AppError('Name is required and must be at least 2 characters long.', 400));
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return next(new AppError('A valid email is required.', 400));
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return next(new AppError('Password must be at least 6 characters long.', 400));
    }

    if (role !== undefined && role !== 'user') {
      return next(new AppError('Normal users cannot assign themselves the admin role.', 403));
    }

    req.body.name = name.trim();
    req.body.email = email.trim().toLowerCase();
    req.body.interests = normalizeInterests(interests);
    req.body.role = 'user';

    return next();
  } catch (error) {
    return next(error);
  }
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return next(new AppError('A valid email is required.', 400));
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long.', 400));
  }

  req.body.email = email.trim().toLowerCase();
  return next();
};

module.exports = {
  validateRegister,
  validateLogin,
};
