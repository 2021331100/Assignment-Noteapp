const AppError = require('./AppError');

const parsePagination = (query, maxLimit = 50) => {
  const page = Number.parseInt(query.page, 10) || 1;
  const limit = Number.parseInt(query.limit, 10) || 10;

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError('Page must be a positive integer.', 400);
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new AppError('Limit must be a positive integer.', 400);
  }

  if (limit > maxLimit) {
    throw new AppError(`Limit cannot exceed ${maxLimit}.`, 400);
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const paginatedResponse = (page, limit, totalRecords, data) => ({
  page,
  limit,
  totalRecords,
  totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
  data,
});

module.exports = {
  parsePagination,
  paginatedResponse,
};
