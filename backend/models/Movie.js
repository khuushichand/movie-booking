/*
This file defines the Movie model for the MongoDB database using Mongoose.
It represents a movie in the booking system, containing details like title, description, and pricing.
*/

const mongoose = require('mongoose');

// Define the schema for Movie documents in the database
const movieSchema = new mongoose.Schema(
  {
    // Movie title - required and trimmed to remove extra spaces
    title: {
      type: String,
      required: [true, 'Please add a movie title'],
      trim: true,
    },
    // Brief description of the movie plot or summary
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    // Array of genres (e.g., ['Action', 'Drama']) - at least one required
    genre: {
      type: [String],
      required: [true, 'Please add at least one genre'],
    },
    // Movie duration in minutes
    duration: {
      type: Number, // in minutes
      required: [true, 'Please add the duration in minutes'],
    },
    // Language the movie is in (e.g., 'English', 'Hindi')
    language: {
      type: String,
      required: [true, 'Please add the language'],
    },
    // URL or path to the movie poster image
    poster: {
      type: String,
      required: [true, 'Please add a poster URL'],
    },
    // Price per ticket for this movie in rupees
    price: {
      type: Number,
      required: [true, 'Please add ticket price'],
      default: 150, // Default price if not specified
    },
    // Movie rating out of 10 (could be from critics or user reviews)
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0, // Default rating if not set
    },
    // Date when the movie was released in theatres
    releaseDate: {
      type: Date,
      required: [true, 'Please add the release date'],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Export the Movie model for use in controllers
module.exports = mongoose.model('Movie', movieSchema);
