const express = require('express');

const { getUserPosts } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/users/:userId/posts', protect, getUserPosts);

module.exports = router;
