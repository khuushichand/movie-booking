const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a movie title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    genre: {
      type: [String],
      required: [true, 'Please add at least one genre'],
    },
    duration: {
      type: Number, // in minutes
      required: [true, 'Please add the duration in minutes'],
    },
    language: {
      type: String,
      required: [true, 'Please add the language'],
    },
    poster: {
      type: String,
      required: [true, 'Please add a poster URL'],
    },
    price: {
      type: Number,
      required: [true, 'Please add ticket price'],
      default: 150,
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    releaseDate: {
      type: Date,
      required: [true, 'Please add the release date'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Movie', movieSchema);
