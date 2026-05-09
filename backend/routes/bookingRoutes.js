const express = require('express');
const router = express.Router();
const {
  getBookings,
  createBooking,
  getBooking,
  deleteBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getBookings).post(protect, createBooking);
router.route('/:id').get(protect, getBooking).delete(protect, deleteBooking);

module.exports = router;
