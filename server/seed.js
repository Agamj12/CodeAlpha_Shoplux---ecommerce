require('dotenv').config();
const { initDB, getDB } = require('./database');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function seed() {
  // Ensure DB is initialized and connected
  if (mongoose.connection.readyState === 0) {
    initDB();
    await new Promise((resolve) => {
      mongoose.connection.once('open', resolve);
    });
  }

  const { Counter, User, Category, Product, CartItem, Order, OrderItem, Review } = getDB();

  console.log('🌱 Seeding database...');

  // 1. Clear existing data
  await Counter.deleteMany({});
  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});
  await CartItem.deleteMany({});
  await Order.deleteMany({});
  await OrderItem.deleteMany({});
  await Review.deleteMany({});
  console.log('🧹 Cleared existing collections');

  // Categories
  const categories = [
    { name: 'Electronics', description: 'Gadgets and electronic devices', icon: '💻' },
    { name: 'Clothing', description: 'Fashion and apparel', icon: '👕' },
    { name: 'Home & Garden', description: 'Home decor and gardening', icon: '🏡' },
    { name: 'Sports', description: 'Sports equipment and gear', icon: '⚽' },
    { name: 'Books', description: 'Books and educational materials', icon: '📚' },
    { name: 'Beauty', description: 'Beauty and personal care', icon: '💄' },
  ];

  const savedCats = await Category.insertMany(categories);
  const cats = {};
  savedCats.forEach(c => {
    cats[c.name] = c._id;
  });

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = new User({
    name: 'Admin User',
    email: 'admin@shop.com',
    password: adminPassword,
    role: 'admin',
    avatar: '#6C63FF'
  });
  await admin.save();

  // Sample user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = new User({
    name: 'John Doe',
    email: 'john@example.com',
    password: userPassword,
    role: 'customer',
    avatar: '#FF6584'
  });
  await user.save();

  // Products
  const products = [
    { name: 'MacBook Pro 14"', description: 'Powerful laptop with M3 chip, 16GB RAM, 512GB SSD. Perfect for developers and creatives.', price: 167999, original_price: 193199,
      category: 'Electronics', stock: 15, featured: 1,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80'
    },
    { name: 'Sony WH-1000XM5', description: 'Industry-leading noise canceling headphones with 30-hour battery life and crystal clear audio.', price: 29399, original_price: 33599,
      category: 'Electronics', stock: 30, featured: 1,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'
    },
    { name: 'iPhone 15 Pro', description: 'Latest iPhone with titanium design, 48MP camera system, and A17 Pro chip.', price: 92399, original_price: null,
      category: 'Electronics', stock: 20, featured: 1,
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&q=80'
    },
    { name: 'Samsung 4K Smart TV 55"', description: '55-inch 4K QLED display with smart TV features, HDR10+, and built-in Alexa.', price: 67199, original_price: 83999,
      category: 'Electronics', stock: 8, featured: 0,
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&q=80'
    },
    { name: 'Nike Air Max 270', description: 'Premium running shoes with Air Max cushioning. Available in multiple colors.', price: 10919, original_price: 12599,
      category: 'Clothing', stock: 50, featured: 1,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80'
    },
    { name: "Levi's 501 Jeans", description: 'Classic straight fit jeans in premium denim. Timeless style that never goes out of fashion.', price: 5879, original_price: null,
      category: 'Clothing', stock: 80, featured: 0,
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80'
    },
    { name: 'Adidas Ultraboost 22', description: 'High-performance running shoes with responsive Boost midsole and Primeknit+ upper.', price: 15119, original_price: 16799,
      category: 'Clothing', stock: 35, featured: 0,
      image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80'
    },
    { name: 'Dyson V15 Detect', description: 'Cordless vacuum with laser dust detection and 60-minute battery life. The most powerful Dyson ever.', price: 54599, original_price: 62999,
      category: 'Home & Garden', stock: 12, featured: 1,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80'
    },
    { name: 'Instant Pot Duo 7-in-1', description: 'Multi-use pressure cooker, slow cooker, rice cooker, steamer, sauté pan, and more.', price: 6719, original_price: 8399,
      category: 'Home & Garden', stock: 25, featured: 0,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80'
    },
    { name: 'Yoga Mat Premium', description: 'Non-slip eco-friendly yoga mat, 6mm thick with alignment lines. Perfect for all yoga styles.', price: 4199, original_price: null,
      category: 'Sports', stock: 45, featured: 0,
      image: 'https://images.unsplash.com/photo-1601925228096-eae0dd1eb405?w=500&q=80'
    },
    { name: 'Wilson Pro Staff Tennis Racket', description: 'Professional tennis racket used by Roger Federer. Perfect control and precision.', price: 20999, original_price: 25199,
      category: 'Sports', stock: 18, featured: 0,
      image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=500&q=80'
    },
    { name: 'Atomic Habits', description: 'By James Clear. The definitive guide on how to build good habits and break bad ones.', price: 1259, original_price: 1679,
      category: 'Books', stock: 100, featured: 1,
      image: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=500&q=80'
    },
    { name: 'The Pragmatic Programmer', description: 'Your journey to mastery. Essential reading for every software developer.', price: 3779, original_price: null,
      category: 'Books', stock: 60, featured: 0,
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&q=80'
    },
    { name: 'Charlotte Tilbury Palette', description: 'Luxury eyeshadow palette with 8 neutral shades. Buildable, blendable, and long-lasting.', price: 5460, original_price: null,
      category: 'Beauty', stock: 22, featured: 0,
      image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&q=80'
    },
    { name: 'Apple Watch Series 9', description: 'Advanced health sensors, crash detection, and 18-hour battery. Your health companion.', price: 33599, original_price: 36119,
      category: 'Electronics', stock: 25, featured: 1,
      image: 'https://images.unsplash.com/photo-1434493907317-a46b5bbe7834?w=500&q=80'
    },
    { name: 'AirPods Pro 2nd Gen', description: 'Active Noise Cancellation, Adaptive Transparency, and Personalized Spatial Audio.', price: 20999, original_price: null,
      category: 'Electronics', stock: 40, featured: 0,
      image: 'https://images.unsplash.com/photo-1600294037592-7f501b2e9a4c?w=500&q=80'
    },
    { name: 'Dell XPS 15 Laptop', description: '15.6" OLED display, Intel Core i9, 32GB RAM, 1TB SSD, NVIDIA RTX 4060.', price: 199999, original_price: 224999,
      category: 'Electronics', stock: 10, featured: 1,
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&q=80', rating: 4.7, reviews_count: 98
    },
    { name: 'Nintendo Switch OLED', description: 'Handheld gaming console with a vibrant 7-inch OLED screen, 64GB storage, and versatile play modes.', price: 32999, original_price: 35999,
      category: 'Electronics', stock: 25, featured: 0,
      image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&q=80', rating: 4.8, reviews_count: 320
    },
    { name: 'Kindle Paperwhite', description: '6.8" display, adjustable warm light, up to 10 weeks of battery life, and 20% faster page turns.', price: 14999, original_price: null,
      category: 'Electronics', stock: 40, featured: 0,
      image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500&q=80', rating: 4.6, reviews_count: 185
    },
    { name: 'Patagonia Torrentshell 3L Jacket', description: 'Simple and unpretentious, our trusted Torrentshell 3L Jacket provides 3-layer waterproof/breathable performance.', price: 12999, original_price: 14999,
      category: 'Clothing', stock: 15, featured: 0,
      image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=500&q=80', rating: 4.5, reviews_count: 76
    },
    { name: 'Ray-Ban Classic Wayfarer', description: 'Distinctive shape paired with the traditional Ray-Ban signature logo on the temples. Unisex polarized sunglasses.', price: 9999, original_price: 11999,
      category: 'Clothing', stock: 30, featured: 1,
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80', rating: 4.7, reviews_count: 243
    },
    { name: 'Nespresso Vertuo Next Coffee Machine', description: 'Elegant design, automatic capsule recognition, and crema-rich coffee brewing in 5 cup sizes.', price: 15999, original_price: 18999,
      category: 'Home & Garden', stock: 12, featured: 1,
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80', rating: 4.4, reviews_count: 112
    },
    { name: 'Ergonomic Office Chair', description: 'Adjustable lumbar support, 3D armrests, breathable mesh back, and high-density foam seat cushion.', price: 18999, original_price: 24999,
      category: 'Home & Garden', stock: 10, featured: 0,
      image: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&q=80', rating: 4.6, reviews_count: 85
    },
    { name: 'Hydro Flask Wide Mouth Water Bottle', description: 'TempShield double-wall vacuum insulation keeps drinks cold up to 24 hours and hot up to 12.', price: 3499, original_price: null,
      category: 'Sports', stock: 100, featured: 1,
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80', rating: 4.8, reviews_count: 562
    },
    { name: 'Fitbit Charge 6', description: 'Premium fitness tracker with built-in GPS, heart rate monitor, stress management tools, and sleep tracking.', price: 13999, original_price: 15999,
      category: 'Sports', stock: 22, featured: 0,
      image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&q=80', rating: 4.3, reviews_count: 94
    },
    { name: 'Sapiens: A Brief History of Humankind', description: 'By Yuval Noah Harari. A groundbreaking narrative of humanity\'s creation and evolution.', price: 499, original_price: 699,
      category: 'Books', stock: 150, featured: 1,
      image: 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?w=500&q=80', rating: 4.7, reviews_count: 1205
    },
    { name: 'Clean Code', description: 'By Robert C. Martin. A handbook of agile software craftsmanship. The ultimate book for writing clean, readable code.', price: 3299, original_price: 3999,
      category: 'Books', stock: 50, featured: 0,
      image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&q=80', rating: 4.9, reviews_count: 489
    },
    { name: 'CeraVe Hydrating Facial Cleanser', description: 'Daily face wash for normal to dry skin with hyaluronic acid, ceramides, and glycerin. Fragrance-free.', price: 1299, original_price: null,
      category: 'Beauty', stock: 80, featured: 0,
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80', rating: 4.8, reviews_count: 642
    },
    { name: 'Fenty Beauty Gloss Bomb', description: 'Universal lip luminizer that delivers explosive shine in one wash, with a non-sticky formula.', price: 2199, original_price: 2499,
      category: 'Beauty', stock: 35, featured: 1,
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80', rating: 4.6, reviews_count: 210
    },
  ];

  const ratings = [4.5, 4.8, 4.7, 4.3, 4.6, 4.2, 4.4, 4.9, 4.1, 4.7, 4.5, 4.8, 4.6, 4.3, 4.7, 4.5];
  const reviewCounts = [128, 342, 512, 89, 234, 156, 98, 67, 145, 78, 43, 891, 234, 112, 445, 267];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const newProduct = new Product({
      name: p.name,
      description: p.description,
      price: p.price,
      original_price: p.original_price,
      category_id: cats[p.category],
      stock: p.stock,
      image: p.image,
      featured: p.featured,
      rating: p.rating || ratings[i] || 4.5,
      reviews_count: p.reviews_count || reviewCounts[i] || 50
    });
    await newProduct.save();
  }

  // Sample orders
  const sampleProducts = await Product.find({}).limit(4);
  const productIds = sampleProducts.map(p => p._id);
  const customer = await User.findOne({ email: 'john@example.com' });
  const userId = customer._id;

  if (productIds.length >= 2) {
    const order = new Order({
      user_id: userId,
      total: 349.98,
      status: 'delivered',
      shipping_address: JSON.stringify({ street: '123 Main St', city: 'New York', state: 'NY', zip: '10001', country: 'USA' }),
      payment_method: 'card'
    });
    await order.save();

    const orderItem1 = new OrderItem({
      order_id: order._id,
      product_id: productIds[0],
      quantity: 1,
      price: 199.99
    });
    await orderItem1.save();

    const orderItem2 = new OrderItem({
      order_id: order._id,
      product_id: productIds[1],
      quantity: 1,
      price: 149.99
    });
    await orderItem2.save();
  }

  console.log('✅ Database seeded successfully!');
  console.log('📧 Admin: admin@shop.com / admin123');
  console.log('📧 User:  john@example.com / user123');
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('👋 Seeding process complete. Exiting.');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Seed error:', err);
      process.exit(1);
    });
}

module.exports = { seed };
