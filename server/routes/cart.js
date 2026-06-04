const express = require('express');
const { getDB } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get cart
router.get('/', authenticateToken, async (req, res) => {
  const { CartItem } = getDB();
  try {
    const items = await CartItem.find({ user_id: req.user.id }).populate('product_id');

    const formattedItems = items.filter(item => item.product_id).map(item => {
      const prod = item.product_id;
      return {
        id: item._id,
        quantity: item.quantity,
        product_id: prod._id,
        name: prod.name,
        price: prod.price,
        image: prod.image,
        stock: prod.stock
      };
    });

    const total = formattedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.json({
      items: formattedItems,
      total,
      count: formattedItems.reduce((sum, item) => sum + item.quantity, 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add to cart
router.post('/add', authenticateToken, async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'Product ID required' });

  const { CartItem, Product } = getDB();
  try {
    const product = await Product.findById(product_id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const existing = await CartItem.findOne({ user_id: req.user.id, product_id });
    const newQty = existing ? existing.quantity + quantity : quantity;

    if (newQty > product.stock) {
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    if (existing) {
      existing.quantity = newQty;
      await existing.save();
    } else {
      const cartItem = new CartItem({
        user_id: req.user.id,
        product_id,
        quantity
      });
      await cartItem.save();
    }

    res.json({ message: 'Item added to cart' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update quantity
router.put('/:id', authenticateToken, async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Invalid quantity' });

  const { CartItem } = getDB();
  try {
    const item = await CartItem.findOne({ _id: req.params.id, user_id: req.user.id }).populate('product_id');
    if (!item) return res.status(404).json({ error: 'Cart item not found' });
    if (!item.product_id) return res.status(404).json({ error: 'Product not found' });

    if (quantity > item.product_id.stock) {
      return res.status(400).json({ error: 'Not enough stock' });
    }

    item.quantity = quantity;
    await item.save();
    res.json({ message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove from cart
router.delete('/:id', authenticateToken, async (req, res) => {
  const { CartItem } = getDB();
  try {
    await CartItem.deleteOne({ _id: req.params.id, user_id: req.user.id });
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear cart
router.delete('/', authenticateToken, async (req, res) => {
  const { CartItem } = getDB();
  try {
    await CartItem.deleteMany({ user_id: req.user.id });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
