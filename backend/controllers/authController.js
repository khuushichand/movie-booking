/*
This file contains controller functions for user authentication.
It handles user registration, login, and retrieving user profile data.
*/

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Helper function to generate a JWT token
// Parameters: id (user's MongoDB ObjectId)
// Returns: JWT token string
// The token expires in 30 days and contains the user's ID
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Controller function to register a new user
// Route: POST /api/auth/register
// Access: Public (no authentication required)
// Expects: { name, email, password, role? } in request body
// Returns: User data with JWT token
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  // Check if user with this email already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create new user (password will be hashed by the User model's pre-save middleware)
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user', // Default to 'user' if no role provided
  });

  if (user) {
    // Return user data and JWT token for immediate login
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// Controller function to authenticate/login a user
// Route: POST /api/auth/login
// Access: Public
// Expects: { email, password } in request body
// Returns: User data with JWT token
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email and include password field (normally excluded)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    res.status(401);
    throw new Error('Invalid email');
  }

  // Debug logs (should be removed in production)
  console.log("Entered password:", password);
  console.log("Stored hash:", user.password);

  // Compare entered password with stored hash
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    res.status(401);
    throw new Error('Invalid password');
  }

  // Return user data and new JWT token
  res.json({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
});

// Controller function to get current user's profile data
// Route: GET /api/auth/me
// Access: Private (requires authentication via protect middleware)
// Returns: Current user's data (set by auth middleware)
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

// Export all controller functions
module.exports = {
  registerUser,
  loginUser,
  getMe,
};
