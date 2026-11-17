const mongoose = require('mongoose');

const User = require('../models/User');
const Note = require('../models/Note');
const Post = require('../models/Post');
const AppError = require('../utils/AppError');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  interests: user.interests,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createUserByAdmin = async (req, res, next) => {
  try {
    const { name, email, password, interests, role } = req.body;

    if (!name || !email || !password) {
      return next(new AppError('Name, email, and password are required.', 400));
    }

    if (role && !['user', 'admin'].includes(role)) {
      return next(new AppError('Role must be either user or admin.', 400));
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return next(new AppError('Email already exists.', 409));
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      interests: Array.isArray(interests) ? interests.map((interest) => String(interest).trim()).filter(Boolean) : [],
      role: role || 'user',
    });

    return res.status(201).json({
      message: 'User created successfully.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, 50);

    const [users, totalRecords] = await Promise.all([
      User.find()
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password')
        .lean(),
      User.countDocuments(),
    ]);

    return res.status(200).json(paginatedResponse(page, limit, totalRecords, users));
  } catch (error) {
    return next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError('Invalid user ID format.', 400));
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError('Invalid user ID format.', 400));
    }

    const { name, email, role, interests, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return next(new AppError('Name must be at least 2 characters long.', 400));
      }
      user.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
        return next(new AppError('A valid email is required.', 400));
      }
      const existingUser = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: user._id } });
      if (existingUser) {
        return next(new AppError('Email already exists.', 409));
      }
      user.email = email.trim().toLowerCase();
    }

    if (role !== undefined) {
      if (!['user', 'admin'].includes(role)) {
        return next(new AppError('Role must be either user or admin.', 400));
      }
      user.role = role;
    }

    if (interests !== undefined) {
      if (!Array.isArray(interests)) {
        return next(new AppError('Interests must be an array of strings.', 400));
      }
      user.interests = interests.map((interest) => String(interest).trim()).filter(Boolean);
    }

    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 6) {
        return next(new AppError('Password must be at least 6 characters long.', 400));
      }
      user.password = password;
    }

    await user.save();

    return res.status(200).json({
      message: 'User updated successfully.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError('Invalid user ID format.', 400));
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    await Note.deleteMany({ userId: req.params.id });
    await Post.deleteMany({ userId: req.params.id });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const listAllNotes = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, 50);

    const [notes, totalRecords] = await Promise.all([
      Note.find()
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email role')
        .lean(),
      Note.countDocuments(),
    ]);

    return res.status(200).json(paginatedResponse(page, limit, totalRecords, notes));
  } catch (error) {
    return next(error);
  }
};

const groupUsersByInterests = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query, 50);
    const skip = (page - 1) * limit;

    const pipeline = [
      { $unwind: '$interests' },
      {
        $group: {
          _id: '$interests',
          users: { $push: '$name' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $facet: {
          meta: [{ $count: 'totalRecords' }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
      {
        $project: {
          totalRecords: {
            $ifNull: [{ $arrayElemAt: ['$meta.totalRecords', 0] }, 0],
          },
          data: 1,
        },
      },
    ];

    const [result] = await User.aggregate(pipeline);

    const totalRecords = result?.totalRecords || 0;
    const data = result?.data || [];

    return res.status(200).json(
      paginatedResponse(page, limit, totalRecords, data)
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createUserByAdmin,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  listAllNotes,
  groupUsersByInterests,
};
