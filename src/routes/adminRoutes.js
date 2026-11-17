const express = require('express');

const {
  createUserByAdmin,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  listAllNotes,
  groupUsersByInterests,
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const {
  validateAdminCreateUser,
  validateAdminUpdateUser,
} = require('../validators/adminValidator');

const router = express.Router();

router.use(protect);
router.use(requireAdmin);

router.post('/users', validateAdminCreateUser, createUserByAdmin);
router.get('/users', listUsers);
router.get('/users/group-by-interests', groupUsersByInterests);
router.get('/users/:id', getUserById);
router.put('/users/:id', validateAdminUpdateUser, updateUser);
router.delete('/users/:id', deleteUser);
router.get('/notes', listAllNotes);

module.exports = router;
