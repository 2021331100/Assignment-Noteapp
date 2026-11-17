const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters.'],
      maxlength: [200, 'Title cannot exceed 200 characters.'],
    },
    content: {
      type: String,
      required: [true, 'Content is required.'],
      trim: true,
      minlength: [5, 'Content must be at least 5 characters.'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required.'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ userId: 1, createdAt: -1, _id: -1 });

module.exports = mongoose.model('Post', postSchema);
