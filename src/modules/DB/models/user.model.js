import mongoose from "mongoose";
const { Schema } = mongoose; // Properly destructure Schema from mongoose

// Corrected User Schema
const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {    
    type: String,   
    required: true,
    unique: true,
    lowercase: true // Recommended for emails
  },
  password: {
    type: String,
    required: true,
    select: false // Prevents password from being returned in queries      
  },
  age: {
    type: Number,
    max: 60,
    required: false
  },
  phone: {
    type: String,
    required: true
  }
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Corrected Note Schema


// Create and export models
export const UserModel = mongoose.model('User', userSchema);
