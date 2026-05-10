/*
This file defines the Show model for the MongoDB database using Mongoose.
It represents a specific screening of a movie at a theatre on a particular date and time.
*/

const mongoose = require('mongoose');

// Define the schema for Show documents in the database
const showSchema = new mongoose.Schema(
  {
    // Reference to the Movie being shown (links to Movie collection)
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie', // References the Movie model
      required: true,
    },
    // Reference to the Theatre where the show is happening
    theatreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre', // References the Theatre model
      required: true,
    },
    // Date of the show (e.g., 2024-05-15)
    date: {
      type: Date,
      required: [true, 'Please add a show date'],
    },
    // Time of the show (e.g., '10:00 AM', '2:30 PM')
    time: {
      type: String,
      required: [true, 'Please add a show time'],
    },
    // Array of seat numbers that have been booked for this show (e.g., ['A1', 'B2'])
    bookedSeats: {
      type: [String],
      default: [], // Starts empty, seats get added when booked
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields
);

// Export the Show model for use in controllers
module.exports = mongoose.model('Show', showSchema);