const express = require('express');
const { getDB } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Place order (checkout)
router.post('/checkout', authenticateToken, (req, res) => {
  const { shipping_address, payment_method = 'card' } = req.body;
  if (!shipping_address) return res.status(400).json({ error: 'Shipping address required' });

  const db = getDB();
  const cartItems = db.prepare(`
    SELECT ci.quantity, p.id as product_id, p.price, p.stock, p.name
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
  `).all(req.user.id);

  if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });

  // Check stock
  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return res.status(400).json({ error: `Insufficient stock for "${item.name}"` });
    }
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const placeOrder = db.transaction(() => {
    const orderResult = db.prepare(
      'INSERT INTO orders (user_id, total, shipping_address, payment_method) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, total, JSON.stringify(shipping_address), payment_method);

    const orderId = orderResult.lastInsertRowid;

    for (const item of cartItems) {
      db.prepare(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
      ).run(orderId, item.product_id, item.quantity, item.price);
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id);
    }

    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    return orderId;
  });

  const orderId = placeOrder();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  res.status(201).json({ message: 'Order placed successfully', order });
});

// Get user orders
router.get('/my-orders', authenticateToken, (req, res) => {
  const db = getDB();
  const orders = db.prepare(`
    SELECT o.*, COUNT(oi.id) as items_count
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all(req.user.id);

  res.json(orders);
});

// Get order details
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = db.prepare(`
    SELECT oi.*, p.name, p.image
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(req.params.id);

  res.json({ ...order, items });
});

// --- ADMIN ---
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  const db = getDB();
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT o.*, u.name as user_name, u.email as user_email, COUNT(oi.id) as items_count
    FROM orders o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }

  query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const orders = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as c FROM orders' + (status ? ' WHERE status = ?' : '')).get(...(status ? [status] : [])).c;

  res.json({ orders, total });
});

router.put('/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const db = getDB();
  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Order status updated' });
});

module.exports = router;
