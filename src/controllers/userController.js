const mongoose = require('mongoose');

const User = require('../models/User');
const AppError = require('../utils/AppError');
const { parsePagination } = require('../utils/pagination');

const getUserPosts = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return next(new AppError('Invalid user ID format.', 400));
    }

    const { page, limit, skip } = parsePagination(req.query, 50);

    const [userWithPosts] = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params.userId) },
      },
      {
        $lookup: {
          from: 'posts',
          let: { userObjId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$userId', '$$userObjId'] },
              },
            },
            { $sort: { createdAt: -1, _id: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          as: 'posts',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          interests: 1,
          createdAt: 1,
          updatedAt: 1,
          posts: 1,
        },
      },
    ]);

    if (!userWithPosts) {
      return next(new AppError('User not found.', 404));
    }

    return res.status(200).json({
      page,
      limit,
      user: userWithPosts,
      posts: userWithPosts.posts,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUserPosts,
};
