const express = require('express');
const { getDB } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Place order (checkout)
router.post('/checkout', authenticateToken, async (req, res) => {
  const { shipping_address, payment_method = 'card' } = req.body;
  if (!shipping_address) return res.status(400).json({ error: 'Shipping address required' });

  const { CartItem, Product, Order, OrderItem } = getDB();

  try {
    const cartItems = await CartItem.find({ user_id: req.user.id }).populate('product_id');

    if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    // Check stock
    for (const item of cartItems) {
      if (!item.product_id) {
        return res.status(400).json({ error: 'Some products in your cart are no longer available.' });
      }
      if (item.quantity > item.product_id.stock) {
        return res.status(400).json({ error: `Insufficient stock for "${item.product_id.name}"` });
      }
    }

    const total = cartItems.reduce((sum, item) => sum + item.product_id.price * item.quantity, 0);

    // Save Order
    const order = new Order({
      user_id: req.user.id,
      total,
      shipping_address: JSON.stringify(shipping_address),
      payment_method
    });
    await order.save();

    // Create Order Items and update product stock
    for (const item of cartItems) {
      const orderItem = new OrderItem({
        order_id: order._id,
        product_id: item.product_id._id,
        quantity: item.quantity,
        price: item.product_id.price
      });
      await orderItem.save();

      // Decrement stock
      await Product.findByIdAndUpdate(item.product_id._id, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear cart items
    await CartItem.deleteMany({ user_id: req.user.id });

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  const { Order, OrderItem } = getDB();
  try {
    const orders = await Order.find({ user_id: req.user.id }).sort({ created_at: -1 });

    const formattedOrders = [];
    for (const o of orders) {
      const count = await OrderItem.countDocuments({ order_id: o._id });
      const oJson = o.toJSON();
      oJson.items_count = count;
      formattedOrders.push(oJson);
    }

    res.json(formattedOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get order details
router.get('/:id', authenticateToken, async (req, res) => {
  const { Order, OrderItem } = getDB();
  try {
    const order = await Order.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const items = await OrderItem.find({ order_id: req.params.id }).populate('product_id');

    const formattedItems = items.filter(oi => oi.product_id).map(oi => {
      const oiJson = oi.toJSON();
      oiJson.name = oi.product_id.name;
      oiJson.image = oi.product_id.image;
      oiJson.product_id = oi.product_id._id;
      return oiJson;
    });

    res.json({ ...order.toJSON(), items: formattedItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN ---
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  const { Order, OrderItem } = getDB();
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};
  if (status) {
    filter.status = status;
  }

  try {
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(parseInt(limit))
      .populate('user_id');

    const formattedOrders = [];
    for (const o of orders) {
      const itemsCount = await OrderItem.countDocuments({ order_id: o._id });
      const oJson = o.toJSON();
      oJson.user_name = o.user_id ? o.user_id.name : 'Unknown';
      oJson.user_email = o.user_id ? o.user_id.email : '';
      oJson.items_count = itemsCount;
      oJson.user_id = o.user_id ? o.user_id._id : null;
      formattedOrders.push(oJson);
    }

    res.json({ orders: formattedOrders, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const { Order } = getDB();
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, {
      status,
      updated_at: new Date()
    }, { new: true });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
