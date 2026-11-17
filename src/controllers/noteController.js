const mongoose = require('mongoose');

const Note = require('../models/Note');
const AppError = require('../utils/AppError');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const createNote = async (req, res, next) => {
  try {
    const note = await Note.create({
      title: req.body.title,
      content: req.body.content,
      userId: req.user._id,
    });

    return res.status(201).json({
      message: 'Note created successfully.',
      note,
    });
  } catch (error) {
    return next(error);
  }
};

const listNotes = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, 50);

    const filter = { userId: req.user._id };
    const [notes, totalRecords] = await Promise.all([
      Note.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Note.countDocuments(filter),
    ]);

    return res.status(200).json(
      paginatedResponse(page, limit, totalRecords, notes)
    );
  } catch (error) {
    return next(error);
  }
};

const getNoteById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError('Invalid note ID format.', 400));
    }

    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      return next(new AppError('Note not found.', 404));
    }

    return res.status(200).json({ note });
  } catch (error) {
    return next(error);
  }
};

const updateNote = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError('Invalid note ID format.', 400));
    }

    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      return next(new AppError('Note not found.', 404));
    }

    if (req.body.title !== undefined) {
      note.title = req.body.title.trim();
    }

    if (req.body.content !== undefined) {
      note.content = req.body.content.trim();
    }

    await note.save();

    return res.status(200).json({
      message: 'Note updated successfully.',
      note,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError('Invalid note ID format.', 400));
    }

    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      return next(new AppError('Note not found.', 404));
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createNote,
  listNotes,
  getNoteById,
  updateNote,
  deleteNote,
};
