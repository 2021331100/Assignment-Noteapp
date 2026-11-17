const express = require('express');

const {
  createNote,
  listNotes,
  getNoteById,
  updateNote,
  deleteNote,
} = require('../controllers/noteController');
const { validateCreateNote, validateUpdateNote } = require('../validators/noteValidator');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', validateCreateNote, createNote);
router.get('/', listNotes);
router.get('/:id', getNoteById);
router.put('/:id', validateUpdateNote, updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
