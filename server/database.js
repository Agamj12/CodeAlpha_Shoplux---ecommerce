const mongoose = require('mongoose');
const models = require('./models');

let isConnected = false;

function initDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ Error: MONGODB_URI is not defined in .env file.");
    return;
  }

  mongoose.connect(uri)
    .then(() => {
      isConnected = true;
      console.log('✅ Connected to MongoDB Atlas successfully');
    })
    .catch(err => {
      console.error('❌ MongoDB Atlas connection error:', err.message);
    });
}

function getDB() {
  return models;
}

module.exports = { getDB, initDB };
