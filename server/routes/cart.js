const express = require('express');
const { getDB } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get cart
router.get('/', authenticateToken, (req, res) => {
  const db = getDB();
  const items = db.prepare(`
    SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image, p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
  `).all(req.user.id);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.json({ items, total, count: items.reduce((sum, item) => sum + item.quantity, 0) });
});

// Add to cart
router.post('/add', authenticateToken, (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'Product ID required' });

  const db = getDB();
  const product = db.prepare('SELECT id, stock FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
  const newQty = existing ? existing.quantity + quantity : quantity;

  if (newQty > product.stock) {
    return res.status(400).json({ error: 'Not enough stock available' });
  }

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(req.user.id, product_id, quantity);
  }

  res.json({ message: 'Item added to cart' });
});

// Update quantity
router.put('/:id', authenticateToken, (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Invalid quantity' });

  const db = getDB();
  const item = db.prepare('SELECT ci.*, p.stock FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ? AND ci.user_id = ?').get(req.params.id, req.user.id);
  if (!item) return res.status(404).json({ error: 'Cart item not found' });
  if (quantity > item.stock) return res.status(400).json({ error: 'Not enough stock' });

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, req.params.id);
  res.json({ message: 'Cart updated' });
});

// Remove from cart
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Item removed' });
});

// Clear cart
router.delete('/', authenticateToken, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Cart cleared' });
});

module.exports = router;
