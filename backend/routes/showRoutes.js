/*
This file defines the routes for show management.
It handles CRUD operations for movie shows and supports filtering.
Routes are mounted at /api/shows in server.js
*/

const express = require('express');
const router = express.Router();
const {
  getShows,
  getShow,
  createShow,
  updateShow,
  deleteShow,
} = require('../controllers/showController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for show collection (/api/shows)
// GET: Public - get all shows (can filter by ?movieId= or ?theatreId=)
// POST: Private/Admin - create new show
router.route('/').get(getShows).post(protect, admin, createShow);

// Routes for individual shows (/api/shows/:id)
// GET: Public - get single show
// PUT: Private/Admin - update show
// DELETE: Private/Admin - delete show
router
  .route('/:id')
  .get(getShow)
  .put(protect, admin, updateShow)
  .delete(protect, admin, deleteShow);

module.exports = router;
