const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');

// @desc    Get all bookings (Admin) or user's bookings
// @route   GET /api/bookings
// @access  Private
const getBookings = asyncHandler(async (req, res) => {
  let bookings;

  if (req.user.role === 'admin') {
    bookings = await Booking.find().populate({
      path: 'userId movieId theatreId showId',
      select: 'name email title name date time',
    });
  } else {
    bookings = await Booking.find({ userId: req.user._id }).populate({
      path: 'movieId theatreId showId',
      select: 'title name date time',
    });
  }

  res.status(200).json(bookings);
});

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res) => {
  const { movieId, theatreId, showId, seats, totalPrice } = req.body;

  // Validate show exists
  const show = await Show.findById(showId);
  if (!show) {
    res.status(404);
    throw new Error('Show not found');
  }

  // Validate theatre exists to check capacity
  const theatre = await Theatre.findById(theatreId);
  if (!theatre) {
    res.status(404);
    throw new Error('Theatre not found');
  }

  // Check if requested seats exceed total capacity or are invalid
  const invalidSeats = seats.filter(seat => seat < 1 || seat > theatre.totalSeats);
  if (invalidSeats.length > 0) {
    res.status(400);
    throw new Error('Some selected seats are invalid for this theatre');
  }

  // Prevent duplicate seat booking
  // Check if any of the requested seats are already in show.bookedSeats
  const alreadyBooked = seats.some((seat) => show.bookedSeats.includes(seat));

  if (alreadyBooked) {
    res.status(400);
    throw new Error('One or more selected seats are already booked');
  }

  // Create booking
  const booking = await Booking.create({
    userId: req.user._id,
    movieId,
    theatreId,
    showId,
    seats,
    totalPrice,
  });

  // Store booked seats properly
  // Update show bookedSeats array
  show.bookedSeats.push(...seats);
  await show.save();

  res.status(201).json(booking);
});

// @desc    Get a single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate({
    path: 'movieId theatreId showId',
    select: 'title name date time',
  });

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Make sure user owns booking or is admin
  if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Not authorized to access this booking');
  }

  res.status(200).json(booking);
});

// @desc    Delete (cancel) booking
// @route   DELETE /api/bookings/:id
// @access  Private
const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Make sure user owns booking or is admin
  if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Not authorized to delete this booking');
  }

  // Remove booked seats from show
  const show = await Show.findById(booking.showId);
  if (show) {
    show.bookedSeats = show.bookedSeats.filter(
      (seat) => !booking.seats.includes(seat)
    );
    await show.save();
  }

  await booking.deleteOne();

  res.status(200).json({ id: req.params.id, message: 'Booking cancelled' });
});

module.exports = {
  getBookings,
  createBooking,
  getBooking,
  deleteBooking,
};
