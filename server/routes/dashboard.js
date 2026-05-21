const express = require('express');
const { getDB } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  const db = getDB();

  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as rev FROM orders WHERE status != 'cancelled'").get().rev;
  const totalOrders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products').get().c;

  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get().c;
  const processingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'processing'").get().c;
  const shippedOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'shipped'").get().c;
  const deliveredOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'delivered'").get().c;

  const recentOrders = db.prepare(`
    SELECT o.id, o.total, o.status, o.created_at, u.name as user_name
    FROM orders o JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC LIMIT 5
  `).all();

  const topProducts = db.prepare(`
    SELECT p.name, p.image, SUM(oi.quantity) as sold, SUM(oi.quantity * oi.price) as revenue
    FROM order_items oi JOIN products p ON oi.product_id = p.id
    GROUP BY oi.product_id ORDER BY sold DESC LIMIT 5
  `).all();

  const revenueByMonth = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, SUM(total) as revenue, COUNT(*) as orders
    FROM orders WHERE status != 'cancelled'
    GROUP BY month ORDER BY month DESC LIMIT 6
  `).all().reverse();

  const lowStockProducts = db.prepare('SELECT id, name, stock FROM products WHERE stock < 10 ORDER BY stock ASC LIMIT 5').all();

  const categoryStats = db.prepare(`
    SELECT c.name, COUNT(p.id) as product_count, SUM(p.stock) as total_stock
    FROM categories c LEFT JOIN products p ON c.id = p.category_id
    GROUP BY c.id
  `).all();

  res.json({
    overview: { totalRevenue, totalOrders, totalUsers, totalProducts },
    orderStatus: { pendingOrders, processingOrders, shippedOrders, deliveredOrders },
    recentOrders,
    topProducts,
    revenueByMonth,
    lowStockProducts,
    categoryStats
  });
});

// Get all users (admin)
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  const db = getDB();
  const { page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT id, name, email, role, avatar, created_at FROM users WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const total = db.prepare(query.replace('SELECT id, name, email, role, avatar, created_at', 'SELECT COUNT(*) as c')).get(...params).c;
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const users = db.prepare(query).all(...params);
  res.json({ users, total });
});

// Update user role
router.put('/users/:id/role', authenticateToken, requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['admin', 'customer'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const db = getDB();
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ message: 'User role updated' });
});

module.exports = router;
