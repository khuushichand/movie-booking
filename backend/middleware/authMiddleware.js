/*
This file contains middleware functions for authentication and authorization.
It protects routes by verifying JWT tokens and checking user roles.
*/

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Middleware to protect routes that require authentication
// Checks for a valid JWT token in the Authorization header
// If valid, attaches the user object (without password) to req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract the token from 'Bearer <token>'
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using the JWT secret from environment variables
      // This ensures the token hasn't been tampered with
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by ID from the decoded token and attach to request
      // Exclude password field for security
      req.user = await User.findById(decoded.id).select('-password');

      // Continue to the next middleware/route handler
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized'); // Token invalid or expired
    }
  }

  // If no token was found in the header
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Middleware to check if the authenticated user has admin role
// Must be used after the 'protect' middleware
// Only allows access if user exists and has role === 'admin'
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // User is admin, proceed
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin'); // User is not admin
  }
};

// Export both middleware functions
module.exports = { protect, admin };
