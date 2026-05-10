/*
This file defines the User model for the MongoDB database using Mongoose.
It represents a user in the movie booking system, with fields for authentication and role-based access.
*/

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the schema for User documents in the database
const userSchema = new mongoose.Schema(
  {
    // User's full name - required field
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    // User's email address - must be unique and valid format
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true, // Ensures no duplicate emails in database
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    // User's password - hashed before storing, minimum 6 characters
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false, // Password is not returned in queries by default for security
    },
    // User's role for access control - either 'user' or 'admin'
    role: {
      type: String,
      enum: ['user', 'admin'], // Only these values are allowed
      default: 'user', // New users are regular users by default
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Middleware that runs before saving a user document
// Encrypts the password using bcrypt if it has been modified
userSchema.pre('save', async function (next) {
  // Skip if password hasn't changed
  if (!this.isModified('password')) {
    next();
  }

  // Generate a salt for hashing (10 rounds for security)
  const salt = await bcrypt.genSalt(10);
  // Hash the password with the salt
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to check if entered password matches the stored hash
// Parameters: enteredPassword (string) - the password to check
// Returns: boolean - true if passwords match, false otherwise
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the User model so it can be used in controllers and routes
module.exports = mongoose.model('User', userSchema);
