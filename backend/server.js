/*
This file is the main entry point for the movie booking backend server.
It sets up the Express application, connects to the MongoDB database,
configures middleware for handling requests, defines API routes,
and starts the server on a specified port.
*/

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB database using the connection function from config/db.js
connectDB();

const app = express();

// Enable CORS (Cross-Origin Resource Sharing) to allow requests from different domains
app.use(cors());

// Parse incoming JSON requests and make the data available in req.body
app.use(express.json());

// Parse URL-encoded data from forms (extended: false means only simple objects)
app.use(express.urlencoded({ extended: false }));

// Mount authentication routes at /api/auth
app.use('/api/auth', require('./routes/authRoutes'));

// Mount movie-related routes at /api/movies
app.use('/api/movies', require('./routes/movieRoutes'));

// Mount theatre-related routes at /api/theatres
app.use('/api/theatres', require('./routes/theatreRoutes'));

// Mount show-related routes at /api/shows
app.use('/api/shows', require('./routes/showRoutes'));

// Mount booking-related routes at /api/bookings
app.use('/api/bookings', require('./routes/bookingRoutes'));

// Mount file upload routes at /api/upload
app.use('/api/upload', require('./routes/uploadRoutes'));

// Serve static files from the uploads folder (for images and other uploaded content)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use custom error handling middleware to catch and respond to errors
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
