const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a theatre name'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Please add a location'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Please add total seats'],
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Theatre', theatreSchema);
