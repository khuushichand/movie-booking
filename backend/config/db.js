/*
This file handles the connection to the MongoDB database using Mongoose.
It exports a function that establishes the database connection asynchronously.
*/

const mongoose = require('mongoose');

// Function to connect to MongoDB database
// Parameters: none
// Returns: nothing (connects to DB and logs success or exits on error)
const connectDB = async () => {
  try {
    // Connect to MongoDB using the connection string from environment variables
    // useNewUrlParser: true - uses the new URL parser instead of deprecated one
    // useUnifiedTopology: true - uses the new server discovery and monitoring engine
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Log successful connection with the host name
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log the error message if connection fails
    console.error(`Error: ${error.message}`);
    // Exit the process with code 1 to indicate failure
    process.exit(1);
  }
};

// Export the connectDB function so it can be used in other files
module.exports = connectDB;
