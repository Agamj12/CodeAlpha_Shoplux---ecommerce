require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { initDB, getDB } = require('./database');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Catch-all to serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Init DB and start server
initDB();

// Auto-seed if database is empty (necessary for serverless/ephemeral hosts like Vercel)
mongoose.connection.once('open', async () => {
  try {
    const { User } = getDB();
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Database is empty. Running auto-seed...');
      const { seed } = require('./seed');
      await seed();
      console.log('🌱 Auto-seed completed successfully!');
    }
  } catch (error) {
    console.error('❌ Failed to run auto-seed check:', error);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 E-Commerce Server running at http://localhost:${PORT}`);
});
