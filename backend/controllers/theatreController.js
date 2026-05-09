const asyncHandler = require('express-async-handler');
const Theatre = require('../models/Theatre');

// @desc    Get all theatres
// @route   GET /api/theatres
// @access  Public
const getTheatres = asyncHandler(async (req, res) => {
  const theatres = await Theatre.find();
  res.status(200).json(theatres);
});

// @desc    Get single theatre
// @route   GET /api/theatres/:id
// @access  Public
const getTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);

  if (!theatre) {
    res.status(404);
    throw new Error('Theatre not found');
  }

  res.status(200).json(theatre);
});

// @desc    Create theatre
// @route   POST /api/theatres
// @access  Private/Admin
const createTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.create(req.body);
  res.status(201).json(theatre);
});

// @desc    Update theatre
// @route   PUT /api/theatres/:id
// @access  Private/Admin
const updateTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);

  if (!theatre) {
    res.status(404);
    throw new Error('Theatre not found');
  }

  const updatedTheatre = await Theatre.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
    }
  );

  res.status(200).json(updatedTheatre);
});

// @desc    Delete theatre
// @route   DELETE /api/theatres/:id
// @access  Private/Admin
const deleteTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);

  if (!theatre) {
    res.status(404);
    throw new Error('Theatre not found');
  }

  await theatre.deleteOne();

  res.status(200).json({ id: req.params.id, message: 'Theatre deleted' });
});

module.exports = {
  getTheatres,
  getTheatre,
  createTheatre,
  updateTheatre,
  deleteTheatre,
};
