/*
This file defines the routes for booking management.
It handles booking creation, retrieval, and cancellation.
All routes require authentication.
Routes are mounted at /api/bookings in server.js
*/

const express = require('express');
const router = express.Router();
const {
  getBookings,
  createBooking,
  getBooking,
  deleteBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// Routes for booking collection (/api/bookings)
// GET: Private - get user's bookings (or all if admin)
// POST: Private - create new booking
router.route('/').get(protect, getBookings).post(protect, createBooking);

// Routes for individual bookings (/api/bookings/:id)
// GET: Private - get single booking (user's own or admin)
// DELETE: Private - cancel booking (user's own or admin)
// Note: No PUT route as bookings are not updated, only created or cancelled
router
  .route('/:id')
  .get(protect, getBooking)
  .delete(protect, deleteBooking);

module.exports = router;