const asyncHandler = require('express-async-handler');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');
const Movie = require('../models/Movie');

// @desc    Get all shows
// @route   GET /api/shows
// @access  Public
const getShows = asyncHandler(async (req, res) => {
  let query;

  if (req.query.movieId) {
    query = Show.find({ movieId: req.query.movieId });
  } else if (req.query.theatreId) {
    query = Show.find({ theatreId: req.query.theatreId });
  } else {
    query = Show.find();
  }

  const shows = await query.populate({
    path: 'movieId theatreId',
    select: 'title name location totalSeats',
  });

  res.status(200).json(shows);
});

// @desc    Get single show
// @route   GET /api/shows/:id
// @access  Public
const getShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id).populate({
    path: 'movieId theatreId',
    select: 'title name location totalSeats',
  });

  if (!show) {
    res.status(404);
    throw new Error('Show not found');
  }

  res.status(200).json(show);
});

// @desc    Create show
// @route   POST /api/shows
// @access  Private/Admin
const createShow = asyncHandler(async (req, res) => {
  // Validate theatre and movie exist
  const theatre = await Theatre.findById(req.body.theatreId);
  if (!theatre) {
    res.status(404);
    throw new Error('Theatre not found');
  }

  const movie = await Movie.findById(req.body.movieId);
  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }

  const show = await Show.create(req.body);
  res.status(201).json(show);
});

// @desc    Update show
// @route   PUT /api/shows/:id
// @access  Private/Admin
const updateShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);

  if (!show) {
    res.status(404);
    throw new Error('Show not found');
  }

  const updatedShow = await Show.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedShow);
});

// @desc    Delete show
// @route   DELETE /api/shows/:id
// @access  Private/Admin
const deleteShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);

  if (!show) {
    res.status(404);
    throw new Error('Show not found');
  }

  await show.deleteOne();

  res.status(200).json({ id: req.params.id, message: 'Show deleted' });
});

module.exports = {
  getShows,
  getShow,
  createShow,
  updateShow,
  deleteShow,
};
