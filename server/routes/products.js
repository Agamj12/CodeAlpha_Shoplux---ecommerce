const express = require('express');
const { getDB } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all products with filters
router.get('/', async (req, res) => {
  const { Product, Category } = getDB();
  const { category, search, sort, featured, page = 1, limit = 12 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};

  try {
    if (category) {
      const catDoc = await Category.findOne({ name: category });
      if (catDoc) {
        filter.category_id = catDoc._id;
      } else {
        return res.json({ products: [], total: 0, page: parseInt(page), totalPages: 0 });
      }
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (featured === 'true') {
      filter.featured = 1;
    }

    const sortMap = {
      'price_asc': { price: 1 },
      'price_desc': { price: -1 },
      'rating': { rating: -1 },
      'newest': { created_at: -1 },
      'name': { name: 1 }
    };
    const sortOption = sortMap[sort] || { created_at: -1 };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(offset)
      .limit(parseInt(limit))
      .populate('category_id');

    const formattedProducts = products.map(p => {
      const pJson = p.toJSON();
      pJson.category_name = p.category_id ? p.category_id.name : null;
      pJson.category_icon = p.category_id ? p.category_id.icon : null;
      pJson.category_id = p.category_id ? p.category_id._id : null;
      return pJson;
    });

    res.json({
      products: formattedProducts,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  const { Product, Review } = getDB();
  try {
    const product = await Product.findById(req.params.id).populate('category_id');
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const reviews = await Review.find({ product_id: req.params.id })
      .sort({ created_at: -1 })
      .populate('user_id');

    const formattedReviews = reviews.map(r => {
      const rJson = r.toJSON();
      rJson.user_name = r.user_id ? r.user_id.name : 'Unknown';
      rJson.user_avatar = r.user_id ? r.user_id.avatar : null;
      rJson.user_id = r.user_id ? r.user_id._id : null;
      return rJson;
    });

    const productJson = product.toJSON();
    productJson.category_name = product.category_id ? product.category_id.name : null;
    productJson.category_icon = product.category_id ? product.category_id.icon : null;
    productJson.category_id = product.category_id ? product.category_id._id : null;

    res.json({ ...productJson, reviews: formattedReviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get categories
router.get('/meta/categories', async (req, res) => {
  const { Category } = getDB();
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add review
router.post('/:id/reviews', authenticateToken, async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const { Product, Review } = getDB();
  try {
    const existing = await Review.findOne({ user_id: req.user.id, product_id: req.params.id });
    if (existing) return res.status(409).json({ error: 'You have already reviewed this product' });

    const review = new Review({
      user_id: req.user.id,
      product_id: req.params.id,
      rating,
      comment
    });
    await review.save();

    // Recompute avg rating and count
    const reviews = await Review.find({ product_id: req.params.id });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(req.params.id, {
      rating: Math.round(avg * 10) / 10,
      reviews_count: reviews.length
    });

    res.status(201).json({ message: 'Review added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN Routes ---
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, price, original_price, category_id, stock, image, featured } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price required' });

  const { Product } = getDB();
  try {
    const product = new Product({
      name,
      description,
      price,
      original_price: original_price || null,
      category_id: category_id || null,
      stock: stock || 0,
      image: image || null,
      featured: featured ? 1 : 0
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, price, original_price, category_id, stock, image, featured } = req.body;
  const { Product } = getDB();

  try {
    const product = await Product.findByIdAndUpdate(req.params.id, {
      name,
      description,
      price,
      original_price: original_price || null,
      category_id: category_id || null,
      stock,
      image: image || null,
      featured: featured ? 1 : 0
    }, { new: true });

    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { Product } = getDB();
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
