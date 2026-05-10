/*
This file defines the routes for movie management.
It handles CRUD operations for movies and database seeding.
Routes are mounted at /api/movies in server.js
*/

const express = require('express');
const router = express.Router();
const {
  getMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  seedMovies,
} = require('../controllers/movieController');
const { protect, admin } = require('../middleware/authMiddleware');

// Route to seed the database with sample movies
// HTTP Method: POST
// Endpoint: /api/movies/seed
// Access: Private/Admin (requires authentication and admin role)
// Why protected: Prevents unauthorized users from modifying the database
router.post('/seed', protect, admin, seedMovies);

// Routes for movie collection (/api/movies)
// GET: Public - get all movies
// POST: Private/Admin - create new movie
router.route('/').get(getMovies).post(protect, admin, createMovie);

// Routes for individual movies (/api/movies/:id)
// GET: Public - get single movie
// PUT: Private/Admin - update movie
// DELETE: Private/Admin - delete movie
router
  .route('/:id')
  .get(getMovie)
  .put(protect, admin, updateMovie)
  .delete(protect, admin, deleteMovie);

module.exports = router;