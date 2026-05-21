const express = require('express');
const { getDB } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all products with filters
router.get('/', (req, res) => {
  const db = getDB();
  const { category, search, sort, featured, page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT p.*, c.name as category_name, c.icon as category_icon
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (category) {
    query += ' AND c.name = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (featured === 'true') {
    query += ' AND p.featured = 1';
  }

  const sortMap = {
    'price_asc': 'p.price ASC',
    'price_desc': 'p.price DESC',
    'rating': 'p.rating DESC',
    'newest': 'p.created_at DESC',
    'name': 'p.name ASC'
  };
  query += ` ORDER BY ${sortMap[sort] || 'p.created_at DESC'}`;

  const totalQuery = query.replace('SELECT p.*, c.name as category_name, c.icon as category_icon', 'SELECT COUNT(*) as total');
  const total = db.prepare(totalQuery).get(...params).total;

  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const products = db.prepare(query).all(...params);
  res.json({ products, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
});

// Get single product
router.get('/:id', (req, res) => {
  const db = getDB();
  const product = db.prepare(`
    SELECT p.*, c.name as category_name, c.icon as category_icon
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!product) return res.status(404).json({ error: 'Product not found' });

  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name, u.avatar as user_avatar
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);

  res.json({ ...product, reviews });
});

// Get categories
router.get('/meta/categories', (req, res) => {
  const db = getDB();
  const categories = db.prepare('SELECT * FROM categories').all();
  res.json(categories);
});

// Add review
router.post('/:id/reviews', authenticateToken, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const db = getDB();
  try {
    const existing = db.prepare('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?').get(req.user.id, req.params.id);
    if (existing) return res.status(409).json({ error: 'You have already reviewed this product' });

    db.prepare('INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)').run(req.user.id, req.params.id, rating, comment);
    
    const avgResult = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE product_id = ?').get(req.params.id);
    db.prepare('UPDATE products SET rating = ?, reviews_count = ? WHERE id = ?').run(
      Math.round(avgResult.avg * 10) / 10, avgResult.count, req.params.id
    );

    res.status(201).json({ message: 'Review added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN Routes ---
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { name, description, price, original_price, category_id, stock, image, featured } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price required' });

  const db = getDB();
  const result = db.prepare(
    'INSERT INTO products (name, description, price, original_price, category_id, stock, image, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(name, description, price, original_price || null, category_id || null, stock || 0, image || null, featured ? 1 : 0);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(product);
});

router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { name, description, price, original_price, category_id, stock, image, featured } = req.body;
  const db = getDB();

  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  db.prepare(
    'UPDATE products SET name = ?, description = ?, price = ?, original_price = ?, category_id = ?, stock = ?, image = ?, featured = ? WHERE id = ?'
  ).run(name, description, price, original_price || null, category_id || null, stock, image || null, featured ? 1 : 0, req.params.id);

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: 'Product deleted' });
});

module.exports = router;
