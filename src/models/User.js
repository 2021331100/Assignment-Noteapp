const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name should be at least 2 characters long.'],
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [6, 'Password must be at least 6 characters.'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    interests: {
      type: [String],
      default: [],
      validate: {
        validator: function (value) {
          return value.every((item) => typeof item === 'string' && item.trim().length > 0);
        },
        message: 'Each interest must be a non-empty string.',
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.pre('findOneAndUpdate', async function hashUpdatedPassword() {
  const update = this.getUpdate();

  if (!update || !update.$set || !update.$set.password) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  update.$set.password = await bcrypt.hash(update.$set.password, salt);
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1, _id: -1 });

module.exports = mongoose.model('User', userSchema);
