const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const {
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getPersonalizedRecommendations,
  parseChatAndRecommend
} = require('../services/recommendation');

const router = express.Router();

// Middleware to optionally extract logged-in user
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const user = jwt.verify(token, JWT_SECRET);
      req.user = user;
    } catch (err) {
      // Treat as guest if token is invalid
    }
  }
  next();
}

// 1. Get personalized recommendations for user (or trending if guest)
router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const limit = parseInt(req.query.limit) || 6;
    const recommendations = await getPersonalizedRecommendations(userId, limit);
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get products similar to/frequently bought with a specific product
router.get('/products/:id', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const recommendations = await getFrequentlyBoughtTogether(req.params.id, limit);
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. AI Assistant chatbot chat endpoint
router.post('/chat', optionalAuthenticate, async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    const userId = req.user ? req.user.id : null;
    const result = await parseChatAndRecommend(message, userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
