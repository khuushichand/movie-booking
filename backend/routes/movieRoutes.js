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

router.post('/seed', seedMovies);

router.route('/').get(getMovies).post(protect, admin, createMovie);
router
  .route('/:id')
  .get(getMovie)
  .put(protect, admin, updateMovie)
  .delete(protect, admin, deleteMovie);

module.exports = router;
