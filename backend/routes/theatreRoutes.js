/*
This file defines the routes for theatre management.
It handles CRUD operations for theatres.
Routes are mounted at /api/theatres in server.js
*/

const express = require('express');
const router = express.Router();
const {
  getTheatres,
  getTheatre,
  createTheatre,
  updateTheatre,
  deleteTheatre,
} = require('../controllers/theatreController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for theatre collection (/api/theatres)
// GET: Public - get all theatres
// POST: Private/Admin - create new theatre
router.route('/').get(getTheatres).post(protect, admin, createTheatre);

// Routes for individual theatres (/api/theatres/:id)
// GET: Public - get single theatre
// PUT: Private/Admin - update theatre
// DELETE: Private/Admin - delete theatre
router
  .route('/:id')
  .get(getTheatre)
  .put(protect, admin, updateTheatre)
  .delete(protect, admin, deleteTheatre);

module.exports = router;
