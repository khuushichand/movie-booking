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

router.route('/').get(getShows).post(protect, admin, createShow);
router
  .route('/:id')
  .get(getShow)
  .put(protect, admin, updateShow)
  .delete(protect, admin, deleteShow);

module.exports = router;
