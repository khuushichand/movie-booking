/*
This file defines the routes for user authentication.
It handles user registration, login, and profile retrieval.
Routes are mounted at /api/auth in server.js
*/

const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Route for user registration
// HTTP Method: POST
// Endpoint: /api/auth/register (when mounted)
// Access: Public (no authentication required)
// Request Body: { name, email, password, role? }
// Calls: registerUser controller
router.post('/register', registerUser);

// Route for user login
// HTTP Method: POST
// Endpoint: /api/auth/login
// Access: Public
// Request Body: { email, password }
// Calls: loginUser controller
router.post('/login', loginUser);

// Route to get current user's profile data
// HTTP Method: GET
// Endpoint: /api/auth/me
// Access: Private (requires valid JWT token via protect middleware)
// Calls: getMe controller
router.get('/me', protect, getMe);

module.exports = router;
