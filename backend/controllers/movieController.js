const asyncHandler = require('express-async-handler');
const Movie = require('../models/Movie');

// @desc    Get all movies
// @route   GET /api/movies
// @access  Public
const getMovies = asyncHandler(async (req, res) => {
  const movies = await Movie.find();
  res.status(200).json(movies);
});

// @desc    Get single movie
// @route   GET /api/movies/:id
// @access  Public
const getMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);

  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }

  res.status(200).json(movie);
});

// @desc    Create movie
// @route   POST /api/movies
// @access  Private/Admin
const createMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.create(req.body);
  res.status(201).json(movie);
});

// @desc    Update movie
// @route   PUT /api/movies/:id
// @access  Private/Admin
const updateMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);

  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }

  const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedMovie);
});

// @desc    Delete movie
// @route   DELETE /api/movies/:id
// @access  Private/Admin
const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);

  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }

  await movie.deleteOne();

  res.status(200).json({ id: req.params.id, message: 'Movie deleted' });
});

// @desc    Seed sample movies for testing
// @route   POST /api/movies/seed
// @access  Public
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
      releaseDate: new Date('2010-07-16')
    },
    {
      title: 'Interstellar',
      description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
      genre: ['Adventure', 'Drama', 'Sci-Fi'],
      duration: 169,
      language: 'English',
      price: 180,
      poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MvrIdlsR.jpg',
      rating: 8.6,
      releaseDate: new Date('2014-11-07')
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
      releaseDate: new Date('2008-07-18')
    }
  ];

  await Movie.deleteMany(); // Clear existing movies
  const createdMovies = await Movie.insertMany(sampleMovies);
  
  res.status(201).json({
    message: 'Sample movies seeded successfully',
    movies: createdMovies
  });
});

module.exports = {
  getMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  seedMovies,
};
