/*
This file contains controller functions for managing movie ticket bookings.
It handles booking creation with atomic seat reservation, booking retrieval, and cancellation.
*/

const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');

// Controller to get bookings - admins see all, users see their own
// Route: GET /api/bookings
// Access: Private
// Returns: Array of booking objects with populated related data
const getBookings = asyncHandler(async (req, res) => {
  let bookings;
  if (req.user.role === 'admin') {
    // Admins can see all bookings with user info
    bookings = await Booking.find().populate({
      path: 'userId movieId theatreId showId',
      select: 'name email title date time',
    });
  } else {
    // Regular users only see their own bookings
    bookings = await Booking.find({ userId: req.user._id }).populate({
      path: 'movieId theatreId showId',
      select: 'title name date time',
    });
  }
  res.status(200).json(bookings);
});

// Controller to create a new booking with atomic seat reservation
// Route: POST /api/bookings
// Access: Private
// Expects: { movieId, theatreId, showId, seats: [], totalPrice } in request body
// Returns: Created booking object
// Why atomic booking: Prevents race conditions when multiple users try to book the same seats simultaneously
const createBooking = asyncHandler(async (req, res) => {
  const { movieId, theatreId, showId, seats, totalPrice } = req.body;

  // Validate theatre exists
  const theatre = await Theatre.findById(theatreId);
  if (!theatre) {
    res.status(404);
    throw new Error('Theatre not found');
  }

  // Validate seat format (e.g., "A1", "B2" - letters A-F, numbers 1-8)
  const validSeatPattern = /^[A-F][1-8]$/;
  const invalidSeats = seats.filter(seat => !validSeatPattern.test(seat));
  if (invalidSeats.length > 0) {
    res.status(400);
    throw new Error(`Invalid seat format: ${invalidSeats.join(', ')}`);
  }

  // Atomic update — only succeeds if NONE of the requested seats are already booked
  // This prevents double-booking in concurrent requests
  const updatedShow = await Show.findOneAndUpdate(
    {
      _id: showId,
      bookedSeats: { $not: { $elemMatch: { $in: seats } } }, // None of the seats are booked
    },
    {
      $push: { bookedSeats: { $each: seats } }, // Add all seats to bookedSeats array
    },
    { new: true }
  );

  // If update failed (null returned), seats were taken by someone else
  if (!updatedShow) {
    res.status(400);
    throw new Error(
      'One or more seats were just booked by someone else. Please reselect your seats.'
    );
  }

  // Create the booking record
  const booking = await Booking.create({
    userId: req.user._id,
    movieId,
    theatreId,
    showId,
    seats,
    totalPrice,
  });

  res.status(201).json(booking);
});

// Controller to get a single booking by ID
// Route: GET /api/bookings/:id
// Access: Private
// Returns: Single booking object with populated data
// Users can only access their own bookings, admins can access any
const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate({
    path: 'movieId theatreId showId',
    select: 'title name date time',
  });

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check ownership or admin role
  if (
    booking.userId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(401);
    throw new Error('Not authorized to access this booking');
  }

  res.status(200).json(booking);
});

// Controller to cancel/delete a booking and free the seats
// Route: DELETE /api/bookings/:id
// Access: Private
// Returns: Success message
// Users can only cancel their own bookings, admins can cancel any
// Why free seats: So the seats become available for other bookings
const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check ownership or admin role
  if (
    booking.userId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(401);
    throw new Error('Not authorized to cancel this booking');
  }

  // Atomically remove the booked seats from the show
  await Show.findByIdAndUpdate(booking.showId, {
    $pull: { bookedSeats: { $in: booking.seats } }, // Remove each seat from bookedSeats array
  });

  await booking.deleteOne();
  res.status(200).json({ id: req.params.id, message: 'Booking cancelled' });
});

// Export all controller functions
module.exports = {
  getBookings,
  createBooking,
  getBooking,
  deleteBooking,
};