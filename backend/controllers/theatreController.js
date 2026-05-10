/*
This file contains controller functions for managing theatres in the booking system.
It provides basic CRUD operations for theatre data.
*/

const asyncHandler = require('express-async-handler');
const Theatre = require('../models/Theatre');

// Controller to get all theatres
// Route: GET /api/theatres
// Access: Public
// Returns: Array of all theatre objects
const getTheatres = asyncHandler(async (req, res) => {
  const theatres = await Theatre.find();
  res.status(200).json(theatres);
});

// Controller to get a single theatre by ID
// Route: GET /api/theatres/:id
// Access: Public
// Returns: Single theatre object
const getTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);

  if (!theatre) {
    res.status(404);
    throw new Error('Theatre not found');
  }

  res.status(200).json(theatre);
});

// Controller to create a new theatre
// Route: POST /api/theatres
// Access: Private/Admin
// Expects: Theatre data in request body (name, location, totalSeats)
// Returns: Created theatre object
const createTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.create(req.body);
  res.status(201).json(theatre);
});

// Controller to update an existing theatre
// Route: PUT /api/theatres/:id
// Access: Private/Admin
// Expects: Updated theatre data in request body
// Returns: Updated theatre object
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
      new: true, // Return the updated document
    }
  );

  res.status(200).json(updatedTheatre);
});

// Controller to delete a theatre
// Route: DELETE /api/theatres/:id
// Access: Private/Admin
// Returns: Success message with deleted theatre ID
const deleteTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);

  if (!theatre) {
    res.status(404);
    throw new Error('Theatre not found');
  }

  await theatre.deleteOne();

  res.status(200).json({ id: req.params.id, message: 'Theatre deleted' });
});

// Export all controller functions
module.exports = {
  getTheatres,
  getTheatre,
  createTheatre,
  updateTheatre,
  deleteTheatre,
};
