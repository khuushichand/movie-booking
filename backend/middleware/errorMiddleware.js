/*
This file contains error handling middleware for the Express application.
It catches errors from routes and controllers, then sends a structured JSON response.
*/

// Error handling middleware function
// Parameters: err (the error object), req (request), res (response), next (next middleware)
// This function is called when an error occurs in any route or controller
const errorHandler = (err, req, res, next) => {
  // Use the status code from the response if set, otherwise default to 500 (Internal Server Error)
  const statusCode = res.statusCode ? res.statusCode : 500;

  // Set the response status code
  res.status(statusCode);

  // Send a JSON response with the error message
  // In production, don't include the stack trace for security reasons
  // In development, include stack trace to help with debugging
  res.json({
    message: err.message, // The error message
    stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Stack trace only in dev mode
  });
};

// Export the error handler middleware
module.exports = { errorHandler };
