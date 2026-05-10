/*
This file defines the Theatre model for the MongoDB database using Mongoose.
It represents a physical theatre location where movies are screened.
*/

const mongoose = require('mongoose');

// Define the schema for Theatre documents in the database
const theatreSchema = new mongoose.Schema(
  {
    // Name of the theatre (e.g., 'PVR Cinemas')
    name: {
      type: String,
      required: [true, 'Please add a theatre name'],
      trim: true, // Removes leading/trailing whitespace
    },
    // Location or address of the theatre
    location: {
      type: String,
      required: [true, 'Please add a location'],
    },
    // Total number of seats available in this theatre
    totalSeats: {
      type: Number,
      required: [true, 'Please add total seats'],
      min: 1, // Must have at least 1 seat
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Export the Theatre model for use in controllers
module.exports = mongoose.model('Theatre', theatreSchema);
