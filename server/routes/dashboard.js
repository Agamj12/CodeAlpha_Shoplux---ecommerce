const express = require('express');
const { getDB } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  const { Order, User, Product, OrderItem, Category } = getDB();

  try {
    // 1. Overview stats
    const revResult = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revResult.length > 0 ? revResult[0].total : 0;
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    // 2. Order status counts
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });

    // 3. Recent orders
    const orders = await Order.find({})
      .sort({ created_at: -1 })
      .limit(5)
      .populate('user_id');

    const recentOrders = orders.map(o => ({
      id: o._id,
      total: o.total,
      status: o.status,
      created_at: o.created_at,
      user_name: o.user_id ? o.user_id.name : 'Unknown'
    }));

    // 4. Top products (based on OrderItem quantity sold)
    const topProductsRaw = await OrderItem.aggregate([
      {
        $group: {
          _id: '$product_id',
          sold: { $sum: '$quantity' },
          revenue: { $sum: { $multiply: ['$quantity', '$price'] } }
        }
      },
      { $sort: { sold: -1 } },
      { $limit: 5 }
    ]);

    const topProducts = [];
    for (const p of topProductsRaw) {
      const productInfo = await Product.findById(p._id);
      topProducts.push({
        name: productInfo ? productInfo.name : 'Deleted Product',
        image: productInfo ? productInfo.image : null,
        sold: p.sold,
        revenue: p.revenue
      });
    }

    // 5. Revenue by Month (last 6 months)
    const revByMonthRaw = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 6 }
    ]);

    const revenueByMonth = revByMonthRaw.map(r => ({
      month: r._id,
      revenue: r.revenue,
      orders: r.orders
    })).reverse();

    // 6. Low stock products
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .sort({ stock: 1 })
      .limit(5)
      .select('_id name stock');

    const formattedLowStock = lowStockProducts.map(p => ({
      id: p._id,
      name: p.name,
      stock: p.stock
    }));

    // 7. Category Stats (count of products and total stock in each category)
    const catStatsRaw = await Product.aggregate([
      {
        $group: {
          _id: '$category_id',
          product_count: { $sum: 1 },
          total_stock: { $sum: '$stock' }
        }
      }
    ]);

    const categoryStats = [];
    const allCats = await Category.find({});
    for (const c of allCats) {
      const stat = catStatsRaw.find(s => s._id === c._id);
      categoryStats.push({
        name: c.name,
        product_count: stat ? stat.product_count : 0,
        total_stock: stat ? stat.total_stock : 0
      });
    }

    res.json({
      overview: { totalRevenue, totalOrders, totalUsers, totalProducts },
      orderStatus: { pendingOrders, processingOrders, shippedOrders, deliveredOrders },
      recentOrders,
      topProducts,
      revenueByMonth,
      lowStockProducts: formattedLowStock,
      categoryStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users (admin)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  const { User } = getDB();
  const { page = 1, limit = 20, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  try {
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(parseInt(limit));

    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user role
router.put('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'customer'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  
  const { User } = getDB();
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User role updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
