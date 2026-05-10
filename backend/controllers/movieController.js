/*
This file contains controller functions for managing movies in the booking system.
It handles CRUD operations for movies and automatically creates shows when movies are added.
*/

const asyncHandler = require('express-async-handler');
const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');

// Helper function to get the first theatre or create a default one if none exists
// This ensures there's always a theatre available for creating shows
// Returns: Theatre document
const getOrCreateTheatre = async () => {
  let theatre = await Theatre.findOne(); // Get any existing theatre
  if (!theatre) {
    // Create default theatre if none exists
    theatre = await Theatre.create({
      name: 'PVR Cinemas',
      location: 'Bangalore',
      totalSeats: 48,
    });
  }
  return theatre;
};

// Controller to get all movies
// Route: GET /api/movies
// Access: Public
// Returns: Array of all movie objects
const getMovies = asyncHandler(async (req, res) => {
  const movies = await Movie.find();
  res.status(200).json(movies);
});

// Controller to get a single movie by ID
// Route: GET /api/movies/:id
// Access: Public
// Returns: Single movie object
const getMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }
  res.status(200).json(movie);
});

// Controller to create a new movie and automatically create a show for it
// Route: POST /api/movies
// Access: Private/Admin
// Expects: Movie data in request body
// Returns: Created movie object
// Why auto-create show: So new movies are immediately bookable
const createMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.create(req.body);

  // Always auto-create a show — creates theatre too if none exists
  const theatre = await getOrCreateTheatre();
  await Show.create({
    movieId: movie._id,
    theatreId: theatre._id,
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    time: '18:30',
    bookedSeats: [],
  });

  res.status(201).json(movie);
});

// Controller to update an existing movie
// Route: PUT /api/movies/:id
// Access: Private/Admin
// Expects: Updated movie data in request body
// Returns: Updated movie object
const updateMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }
  const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Return the updated document
  });
  res.status(200).json(updatedMovie);
});

// Controller to delete a movie and all its associated shows
// Route: DELETE /api/movies/:id
// Access: Private/Admin
// Returns: Success message with deleted movie ID
// Why delete shows: Clean up related data to prevent orphaned shows
const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }

  // Delete all shows for this movie too
  await Show.deleteMany({ movieId: req.params.id });
  await movie.deleteOne();

  res.status(200).json({ id: req.params.id, message: 'Movie deleted' });
});

// Controller to seed the database with sample movies and create shows for each
// Route: POST /api/movies/seed
// Access: Private/Admin
// Returns: Success message and created movies
// Why: For development/testing - populate DB with sample data quickly
const seedMovies = asyncHandler(async (req, res) => {
  const sampleMovies = [
    {
      title: 'Inception',
      description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      genre: ['Action', 'Sci-Fi', 'Thriller'],
      duration: 148,
      language: 'English',
      price: 150,
      poster: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
      rating: 8.8,
      releaseDate: new Date('2010-07-16'),
    },
    {
      title: 'Interstellar',
      description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
      genre: ['Adventure', 'Drama', 'Sci-Fi'],
      duration: 169,
      language: 'English',
      price: 180,
      poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MvrIdlsR.jpg',
      rating: 8.6,
      releaseDate: new Date('2014-11-07'),
    },
    {
      title: 'The Dark Knight',
      description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
      genre: ['Action', 'Crime', 'Drama'],
      duration: 152,
      language: 'English',
      price: 200,
      poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      rating: 9.0,
      releaseDate: new Date('2008-07-18'),
    },
  ];

  // Clear existing movies and shows first
  await Show.deleteMany({});
  await Movie.deleteMany({});
  const createdMovies = await Movie.insertMany(sampleMovies);

  // Auto-create shows for each seeded movie with different times
  const theatre = await getOrCreateTheatre();
  const showTimes = ['15:00', '18:30', '21:00']; // Different show times
  for (let i = 0; i < createdMovies.length; i++) {
    await Show.create({
      movieId: createdMovies[i]._id,
      theatreId: theatre._id,
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      time: showTimes[i % showTimes.length], // Cycle through show times
      bookedSeats: [],
    });
  }

  res.status(201).json({
    message: 'Sample movies seeded successfully',
    movies: createdMovies,
  });
});

// Export all controller functions
module.exports = {
  getMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  seedMovies,
};