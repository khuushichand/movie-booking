/*
This file defines the Booking model for the MongoDB database using Mongoose.
It represents a ticket booking made by a user for a specific movie show at a theatre.
*/

const mongoose = require('mongoose');

// Define the schema for Booking documents in the database
const bookingSchema = new mongoose.Schema(
  {
    // Reference to the User who made the booking
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Links to User model
      required: true,
    },
    // Reference to the Movie being booked
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie', // Links to Movie model
      required: true,
    },
    // Reference to the Theatre where the show is
    theatreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre', // Links to Theatre model
      required: true,
    },
    // Reference to the specific Show (date/time) being booked
    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show', // Links to Show model
      required: true,
    },
    // Array of seat numbers booked (e.g., ['A1', 'A2'])
    seats: {
      type: [String],
      required: true,
    },
    // Total price for all seats booked
    totalPrice: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields
);

// Export the Booking model for use in controllers
module.exports = mongoose.model('Booking', bookingSchema);