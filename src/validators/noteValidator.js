const AppError = require('../utils/AppError');

const validateCreateNote = (req, res, next) => {
  const { title, content } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    return next(new AppError('Title is required and must be at least 2 characters long.', 400));
  }

  if (!content || typeof content !== 'string' || content.trim().length < 5) {
    return next(new AppError('Content is required and must be at least 5 characters long.', 400));
  }

  req.body.title = title.trim();
  req.body.content = content.trim();
  return next();
};

const validateUpdateNote = (req, res, next) => {
  const { title, content } = req.body;

  if (!title && !content) {
    return next(new AppError('At least one field is required to update a note.', 400));
  }

  if (title !== undefined && (typeof title !== 'string' || title.trim().length < 2)) {
    return next(new AppError('Title must be at least 2 characters long.', 400));
  }

  if (content !== undefined && (typeof content !== 'string' || content.trim().length < 5)) {
    return next(new AppError('Content must be at least 5 characters long.', 400));
  }

  if (title !== undefined) req.body.title = title.trim();
  if (content !== undefined) req.body.content = content.trim();

  return next();
};

module.exports = {
  validateCreateNote,
  validateUpdateNote,
};
