/*
This file contains controller functions for managing movie shows in the booking system.
It handles CRUD operations for shows and supports filtering by movie or theatre.
*/

const asyncHandler = require('express-async-handler');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');
const Movie = require('../models/Movie');

// Controller to get all shows, with optional filtering
// Route: GET /api/shows
// Access: Public
// Query params: movieId (filter shows for a specific movie), theatreId (filter shows for a specific theatre)
// Returns: Array of show objects with populated movie and theatre data
const getShows = asyncHandler(async (req, res) => {
  let query;

  // Filter shows based on query parameters
  if (req.query.movieId) {
    query = Show.find({ movieId: req.query.movieId });
  } else if (req.query.theatreId) {
    query = Show.find({ theatreId: req.query.theatreId });
  } else {
    query = Show.find(); // Get all shows if no filter
  }

  // Populate related movie and theatre data for richer responses
  const shows = await query.populate({
    path: 'movieId theatreId',
    select: 'title name location totalSeats', // Only include these fields
  });

  res.status(200).json(shows);
});

// Controller to get a single show by ID
// Route: GET /api/shows/:id
// Access: Public
// Returns: Single show object with populated movie and theatre data
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

// Controller to create a new show
// Route: POST /api/shows
// Access: Private/Admin
// Expects: Show data in request body (movieId, theatreId, date, time, bookedSeats)
// Returns: Created show object
// Why validate theatre/movie: Ensure referenced entities exist to prevent invalid shows
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

// Controller to update an existing show
// Route: PUT /api/shows/:id
// Access: Private/Admin
// Expects: Updated show data in request body
// Returns: Updated show object
const updateShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);

  if (!show) {
    res.status(404);
    throw new Error('Show not found');
  }

  const updatedShow = await Show.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Return the updated document
  });

  res.status(200).json(updatedShow);
});

// Controller to delete a show
// Route: DELETE /api/shows/:id
// Access: Private/Admin
// Returns: Success message with deleted show ID
const deleteShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);

  if (!show) {
    res.status(404);
    throw new Error('Show not found');
  }

  await show.deleteOne();

  res.status(200).json({ id: req.params.id, message: 'Show deleted' });
});

// Export all controller functions
module.exports = {
  getShows,
  getShow,
  createShow,
  updateShow,
  deleteShow,
};
